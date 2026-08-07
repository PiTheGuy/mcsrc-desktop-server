export function sendCefQuery(payload: object) : Promise<string> {
    return new Promise((resolve, reject) => {
        window.cefQuery({
            request: JSON.stringify(payload),
            onSuccess: resolve,
            onFailure: (error_code, error_message) => reject(new Error(`query failed (${error_code}): ${error_message}`))
        })
    })
}

type CefFetchMessage =
    | { type: "progress"; percent: number }
    | { type: "done"; path: string };

export function sendCefQueryWithProgress(payload: object, onProgress: (percent: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
        const queryId = window.cefQuery({
            request: JSON.stringify(payload),
            persistent: true,
            onSuccess: (response) => {
                const message = JSON.parse(response) as CefFetchMessage;

                if (message.type === "progress") {
                    onProgress(message.percent);
                    return;
                }

                window.cefQueryCancel?.(queryId);
                resolve(message.path);
            },
            onFailure: (error_code, error_message) => {
                window.cefQueryCancel?.(queryId);
                reject(new Error(`query failed (${error_code}): ${error_message}`));
            }
        });
    })
}