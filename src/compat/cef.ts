export function sendCefQuery(query: object) : Promise<string> {
    return new Promise((resolve, reject) => {
        window.cefQuery({
            request: JSON.stringify(query),
            onSuccess: resolve,
            onFailure: (error_code, error_message) => reject(new Error(`query failed (${error_code}): ${error_message}`))
        })
    })
}