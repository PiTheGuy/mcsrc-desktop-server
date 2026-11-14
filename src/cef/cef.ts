import type {Query} from "./Query.ts";

export function sendCefQuery(payload: Query) : Promise<string> {
    return new Promise((resolve, reject) => {
        window.cefQuery({
            request: JSON.stringify(payload),
            onSuccess: resolve,
            onFailure: (error_code, error_message) => reject(new QueryFailedError(error_code, error_message))
        })
    })
}

export class QueryFailedError extends Error {
    errorCode : number;

    constructor(errorCode: number, message: string) {
        super(message);
        this.errorCode = errorCode;
    }
}

export const QueryErrorCode = {
    GenericError: -2,
    Canceled: -1,
    FileNotFound: 1,
    DirectoryNotEmpty: 2,
} as const;

type CefProgressMessage =
    | { type: "progress"; progress: number }
    | { type: "done"; result: any };

export function sendCefQueryWithProgress(payload: object, onProgress?: (percent: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
        const queryId = window.cefQuery({
            request: JSON.stringify(payload),
            persistent: true,
            onSuccess: (response) => {
                const message = JSON.parse(response) as CefProgressMessage;

                if (message.type === "progress") {
                    onProgress?.(Math.round(message.progress * 100));
                    return;
                }

                window.cefQueryCancel?.(queryId);
                resolve(message.result);
            },
            onFailure: (error_code, error_message) => {
                window.cefQueryCancel?.(queryId);
                reject(new Error(`query failed (${error_code}): ${error_message}`));
            }
        });
    })
}