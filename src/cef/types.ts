export {}; // ensures this is treated as a module if needed

declare global {
    interface Window {
        cefQuery: (query: CefQuery) => number; // cefQuery returns a query id you can use to cancel it
        cefQueryCancel?: (queryId: number) => void;
    }
}

export type CefQuery = {
    request: string;
    onSuccess?: (response: string) => void;
    onFailure?: (error_code: number, error_message: string) => void;
    persistent?: boolean;
}