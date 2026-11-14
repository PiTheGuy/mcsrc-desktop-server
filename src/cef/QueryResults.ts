import type {UnpickConfig} from "../workers/decompile/Unpick.ts";

export type DownloadQueryResult = {
    jar: string;
    mappings: string;
}

export type JavadocOpenProjectQueryResult = {
    path: string;
    unpick?: UnpickConfig;
    runtimeLibraries?: SerializedRuntimeLibrary[];
    version: string;
    files: SerializedMappingFile[];
}

export type SerializedRuntimeLibrary = {
    name: string;
    url: string;
}

export type SerializedMappingFile = {
    path: string;
    content: ArrayBuffer;
}