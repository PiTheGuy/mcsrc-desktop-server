import * as Comlink from "comlink";
import { BehaviorSubject, distinctUntilChanged, map, shareReplay } from "rxjs";
import { minecraftJar, type MinecraftJar } from "../../logic/MinecraftApi";
import type { ClassDataString, JarIndexer, MemberData, ReferenceKey,  ReferenceString } from "./types";
import Dexie, { type EntityTable } from "dexie";
import { isClassFilePath, type ClassFilePath, type ClassName } from "../../utils/Names";
import {sendCefQuery, sendCefQueryWithProgress} from "../../cef/cef.ts";
import {IS_DESKTOP_APP} from "../../site.ts";
import {parseClassData, parseMemberData} from "./parse.ts";


export interface ClassData {
    className: ClassName;
    superName: ClassName | "";
    accessFlags: number;
    interfaces: ClassName[];
}

// Percent complete is total >= 0
export const indexProgress = new BehaviorSubject<number>(-1);

let currentJarIndex: JarIndex | null = null;

export const jarIndex = minecraftJar.pipe(
    distinctUntilChanged(),
    map(jar => {
        // Clean up the previous JarIndex instance
        if (currentJarIndex) {
            currentJarIndex.destroy();
        }

        const newIndex = new JarIndex(jar);
        currentJarIndex = newIndex;
        return newIndex;
    }),
    shareReplay({ bufferSize: 1, refCount: false })
);

interface JarClassData {
    name: string,
    classes: ClassData[],
}

const db = new Dexie("indexer") as Dexie & {
    classData: EntityTable<JarClassData, "name">;
};
db.version(1).stores({
    classData: "name"
});

// Number of classes to send to each worker in a single batch
const batchSize = 25;

export class JarIndex {
    readonly minecraftJar: MinecraftJar;

    private _workers: ReturnType<typeof createWrorker>[] | undefined;
    private get workers() {
        if (this._workers) return this._workers;
        const threads = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
        this._workers = Array.from({ length: threads }, () => createWrorker());
        console.log(`Created JarIndex with ${threads} workers`);
        return this._workers;
    }

    private indexPromise: Promise<void> | null = null;
    private classDataCache: ClassData[] | null = null;

    constructor(minecraftJar: MinecraftJar) {
        this.minecraftJar = minecraftJar;
    }

    destroy(): void {
        if (this._workers) {
            for (const worker of this._workers) {
                worker.w.terminate();
            }
            delete this._workers;
        }
        this.classDataCache = null;
        this.indexPromise = null;
    }

    private async indexJar(): Promise<void> {
        if (!this.indexPromise) {
            this.indexPromise = IS_DESKTOP_APP ? this.performIndexingOnHost() : this.performIndexing();
        }
        return this.indexPromise;
    }

    private async performIndexingOnHost(): Promise<void> {
        try {
            const startTime = performance.now();

            indexProgress.next(0);
            console.log(`Indexing minecraft jar using host JVM`);

            await sendCefQueryWithProgress({
                action: "index",
                type: "start",
                version: this.minecraftJar.version,
            }, progress => indexProgress.next(progress)).then(() => {
                const endTime = performance.now();
                const duration = ((endTime - startTime) / 1000).toFixed(2);
                console.log(`Indexing completed in ${duration} seconds`);
                indexProgress.next(-1);
            })
        } catch (error) {
            this.indexPromise = null;
            throw error;
        }
    }

    private async performIndexing(): Promise<void> {
        try {
            const startTime = performance.now();

            indexProgress.next(0);
            console.log(`Indexing minecraft jar using ${this.workers.length} workers`);

            // Initialize all workers in parallel
            await Promise.all(this.workers.map(worker => worker.c.setJar(this.minecraftJar.version, this.minecraftJar.blob)));

            const jar = this.minecraftJar.jar;
            const classNames = Object.keys(jar.entries)
                .filter(isClassFilePath);

            let promises: Promise<number>[] = [];

            let taskQueue: ClassFilePath[] = [...classNames];
            let completed = 0;

            for (let i = 0; i < this.workers.length; i++) {
                const worker = this.workers[i];

                promises.push((async () => {
                    while (true) {
                        const batch = taskQueue.splice(0, batchSize);

                        if (batch.length === 0) {
                            const indexed = await worker.c.getReferenceSize();
                            return indexed;
                        }

                        await worker.c.indexBatch(batch);
                        completed += batch.length;

                        indexProgress.next(Math.round((completed / classNames.length) * 100));
                    }
                })());
            }

            const indexedCounts = await Promise.all(promises);
            const totalIndexed = indexedCounts.reduce((sum, count) => sum + count, 0);

            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            console.log(`Indexing completed in ${duration} seconds. Total indexed: ${totalIndexed}`);
            indexProgress.next(-1);
        } catch (error) {
            // Reset promise on error so indexing can be retried
            this.indexPromise = null;
            throw error;
        } finally {
            await Promise.all(this.workers.map(worker => worker.c.setJar("", null)));
        }
    }

    async getReference(key: ReferenceKey): Promise<ReferenceString[]> {
        await this.indexJar();

        if (IS_DESKTOP_APP) {
            return JSON.parse(await sendCefQuery({
                action: "index",
                type: "getReference",
                key: key
            }))
        }

        let results: Promise<ReferenceString[]>[] = [];

        for (const worker of this.workers) {
            results.push(worker.c.getReference(key));
        }

        return Promise.all(results).then(arrays => arrays.flat());
    }

    async getMemberData(): Promise<MemberData[]> {
        await this.indexJar();

        if (IS_DESKTOP_APP) {
            return JSON.parse(await sendCefQuery({
                action: "index",
                type: "getMemberData",
                version: this.minecraftJar.version,
            })).map(parseMemberData);
        }

        let results: Promise<MemberData[]>[] = [];

        for (const worker of this.workers) {
            results.push(worker.c.getMemberData());
        }

        return Promise.all(results).then(arrays => arrays.flat());
    }
    async getClassData(): Promise<ClassData[]> {
        if (this.classDataCache) {
            return this.classDataCache;
        }

        const dbResult = await db.classData.get(this.minecraftJar.jar.name);
        if (dbResult) {
            this.classDataCache = dbResult.classes;
            return this.classDataCache;
        }

        try {
            await this.indexJar();

            let classDataStrings : ClassDataString[];
            if (IS_DESKTOP_APP) {
                classDataStrings = JSON.parse(await sendCefQuery({
                    action: "index",
                    type: "getClassData",
                    version: this.minecraftJar.version,
                }))
            } else {
                let results: Promise<ClassDataString[]>[] = [];
                for (const worker of this.workers) {
                    results.push(worker.c.getClassData());
                }

                classDataStrings = await Promise.all(results).then(arrays => arrays.flat());
            }
            this.classDataCache = classDataStrings.map(parseClassData);

            await db.classData.put({
                name: this.minecraftJar.jar.name,
                classes: this.classDataCache,
            });

            return this.classDataCache;
        } finally {
            this.destroy();
        }
    }
}

let bytecodeWorker: ReturnType<typeof createWrorker> | null = null;

export async function getBytecode(classData: ArrayBufferLike[]): Promise<string> {
    if (!bytecodeWorker) {
        bytecodeWorker = createWrorker();
    }

    return bytecodeWorker.c.getBytecode(classData);
}

function createWrorker() {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module", name: "jar-indexer" });
    return {
        c: Comlink.wrap<JarIndexer>(worker),
        w: worker,
    };
}
