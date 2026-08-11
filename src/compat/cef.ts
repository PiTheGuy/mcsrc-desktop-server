export function sendCefQuery(payload: object) : Promise<string> {
    return new Promise((resolve, reject) => {
        window.cefQuery({
            request: JSON.stringify(payload),
            onSuccess: resolve,
            onFailure: (error_code, error_message) => reject(new Error(`query failed (${error_code}): ${error_message}`))
        })
    })
}

type CefProgressMessage =
    | { type: "progress"; progress: number }
    | { type: "done"; result: any };

export function sendCefQueryWithProgress(payload: object, onProgress: (percent: number) => void): Promise<any> {
    return new Promise((resolve, reject) => {
        const queryId = window.cefQuery({
            request: JSON.stringify(payload),
            persistent: true,
            onSuccess: (response) => {
                const message = JSON.parse(response) as CefProgressMessage;

                if (message.type === "progress") {
                    onProgress(message.progress * 100);
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