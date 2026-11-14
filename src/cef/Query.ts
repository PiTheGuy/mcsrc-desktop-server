import type {UnpickConfig} from "../workers/decompile/Unpick.ts";

export type Query = VersionQuery | UpdateQuery | DownloadQuery | DecompileQuery | BytecodeQuery | IndexQuery | RemapQuery | JavadocQuery | FileQuery;

type VersionQuery = {
    type: 'version';
}

type UpdateQuery = {
    type: 'update';
}

type DownloadQuery = {
    type: 'download';
    version: string;
}

type DecompileQuery = {
    type: 'decompile';
    className: string;
    version: string;
    unpick?: UnpickConfig;
    options: {
        displayLambdas: boolean;
    }
}

type BytecodeQuery = {
    type: 'bytecode';
    className: string;
    version: string;
}

type IndexQuery = IndexStartQuery | IndexGetReferenceQuery | IndexGetReferenceSizeQuery | IndexGetClassDataQuery | IndexGetMemberDataQuery;

type IndexStartQuery = {
    type: 'index';
    action: 'start';
    version: string;
}

type IndexGetReferenceQuery = {
    type: 'index';
    action: 'getReference';
    key: string;
}

type IndexGetReferenceSizeQuery = {
    type: 'index';
    action: 'getReferenceSize';
}

type IndexGetClassDataQuery = {
    type: 'index';
    action: 'getClassData';
}

type IndexGetMemberDataQuery = {
    type: 'index';
    action: 'getMemberData';
}

type RemapQuery = {
    type: 'remap';
    version: string;
}

type JavadocQuery = JavadocWriteQuery | JavadocOpenProjectQuery;

type JavadocWriteQuery = {
    type: 'javadoc';
    action: 'write';
    path: string;
    base64: string;
}

type JavadocOpenProjectQuery = {
    type: 'javadoc';
    action: 'open_project';
    alternateFilePicker: boolean;
}

type FileQuery = FileReadQuery | FileWriteQuery | FileCreateFileQuery | FileCreateDirectoryQuery | FileDeleteQuery | FileDirectoryContentsQuery;

type FileReadQuery = {
    type: 'file';
    action: 'read';
    path: string;
}

type FileWriteQuery = {
    type: 'file';
    action: 'write';
    path: string;
    bytes: number[];
}

type FileCreateFileQuery = {
    type: 'file';
    action: 'create_file';
    path: string;
}

type FileCreateDirectoryQuery = {
    type: 'file';
    action: 'create_directory';
    path: string;
}

type FileDeleteQuery = {
    type: 'file';
    action: 'delete';
    path: string;
    recursive: boolean;
}

type FileDirectoryContentsQuery = {
    type: 'file';
    action: 'directory_contents';
    path: string;
}