import {QueryErrorCode, QueryFailedError, sendCefQuery} from "./cef.ts";

type DesktopHandle = FileSystemDirectoryHandle | FileSystemFileHandle;

type SerializedDesktopHandle = {
    kind: "directory" | "file";
    path: string;
}

export class DesktopDirectoryHandle implements FileSystemDirectoryHandle {
    readonly kind: "directory";
    readonly path: string;
    readonly name: string;

    constructor(path: string) {
        this.kind = "directory";
        this.path = path;
        this.name = path.split("/").pop() ?? "";
    }

    [Symbol.asyncIterator](): FileSystemDirectoryHandleAsyncIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]> {
        return this.entries();
    }

    async *entries(): FileSystemDirectoryHandleAsyncIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]> {
        const contents = await this.getContents();
        for (const entry of contents) {
            yield entry;
        }
    }

    async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle> {
        const contents = await this.getContents();
        const path = `${this.path}/${name}`;
        const handle = contents.get(path);
        if (!handle) {
            if (options?.create) {
                await sendCefQuery({
                    type: "file",
                    action: "create_directory",
                    path: path
                })
                return new DesktopDirectoryHandle(path);
            }
            throw new DOMException(path, "NotFoundError");
        }
        if (handle.kind != "directory") {
            throw new DOMException(path, "TypeMismatchError");
        }
        return handle;
    }

    async getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
        const contents = await this.getContents();
        let path = `${this.path}/${name}`;
        const handle = contents.get(path);
        if (!handle) {
            if (options?.create) {
                await sendCefQuery({
                    type: "file",
                    action: "create_file",
                    path: path
                })
                return new DesktopFileHandle(path);
            }
            throw new DOMException(path, "NotFoundError");
        }
        if (handle.kind != "file") {
            throw new DOMException(path, "TypeMismatchError");
        }
        return handle;
    }

    isSameEntry(other: FileSystemHandle): Promise<boolean> {
        return Promise.resolve(other instanceof DesktopFileHandle && other.path == this.path);
    }

    async *keys(): FileSystemDirectoryHandleAsyncIterator<string> {
        const contents = await this.getContents();
        for (const name of contents.keys()) {
            yield name;
        }
    }

    async removeEntry(name: string, options?: { recursive?: boolean }): Promise<void> {
        const path = `${this.path}/${name}`;
        try {
            await sendCefQuery({
                type: "file",
                action: "delete",
                path: path,
                recursive: options?.recursive || false
            }) // TODO error checking
        } catch (error) {
            if (error instanceof QueryFailedError && error.errorCode == QueryErrorCode.FileNotFound) {
                throw new DOMException(path, "NotFoundError")
            }
            throw error;
        }

    }

    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null> {
        return Promise.resolve(null);
    }

    async *values(): FileSystemDirectoryHandleAsyncIterator<FileSystemFileHandle | FileSystemDirectoryHandle> {
        const contents = await this.getContents();
        for (const value of contents.values()) {
            yield value;
        }
    }

    async getContents(): Promise<Map<string, DesktopHandle>> {
        try {
            const result = JSON.parse(await sendCefQuery({
                type: "file",
                action: "directory_contents",
                path: this.path
            }))
            const contents = new Map<string, DesktopHandle>();
            result.forEach((item: any) => {
                if (item.type === "file") {
                    contents.set(item.path, new DesktopFileHandle(item.path));
                } else {
                    contents.set(item.path, new DesktopDirectoryHandle(item.path));
                }
            })
            return contents;
        } catch (error) {
            if (error instanceof QueryFailedError && error.errorCode == QueryErrorCode.FileNotFound) {
                throw new DOMException(this.path, "NotFoundError")
            }
            throw error;
        }

    }

}

export class DesktopFileHandle implements FileSystemFileHandle {
    readonly kind: "file";
    readonly path: string;
    readonly name: string;

    constructor(path : string) {
        this.kind = "file";
        this.path = path;
        this.name = path.split("/").pop() ?? "";
    }


    createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream> {
        throw new Error("Call to createWritable outside of writeBytes");
    }

    async getFile(): Promise<File> {
        try {
            const parts = this.path.split("/");
            const name = parts[parts.length - 1];
            const url = await sendCefQuery({
                type: "file",
                action: "read",
                path: this.path
            })
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], name);
        } catch (error) {
            if (error instanceof QueryFailedError && error.errorCode == QueryErrorCode.FileNotFound) {
                throw new DOMException(this.path, "NotFoundError")
            }
            throw error;
        }

    }

    isSameEntry(other: FileSystemHandle): Promise<boolean> {
        return Promise.resolve(false);
    }

}