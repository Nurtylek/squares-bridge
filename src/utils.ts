function createRequestResolver() {
    type PromiseController = {
        resolve: (value: any) => any;
        reject: (reason: any) => any;
    };

    const promiseControllers: Record<string, PromiseController | null> = {};

    return {
        add(controller: PromiseController): number | string {
            const id = crypto.randomUUID();
            promiseControllers[id] = controller;
            return id;
        },

        resolve<T>(reqId: number | string, data: T, isSuccess: (data: T) => boolean, error: any) {
            const requestPromise = promiseControllers[reqId];

            if (requestPromise) {
                if (isSuccess(error)) {
                    requestPromise.resolve(data);
                } else {
                    requestPromise.reject(error);
                }

                promiseControllers[reqId] = null;
            }
        },
    };
}

function handleSubscribe(subscribe: (handler: (event: any) => void) => void, requestResolver: ReturnType<typeof createRequestResolver>) {
    subscribe(event => {
        if (!event.detail) {
            return;
        }

        if ('reqId' in event.detail) {
            const { reqId, data, error } = event.detail;

            if (reqId) {
                requestResolver.resolve(reqId, data, (error) => !(error), error);
            }
        }
    })
}

export function promisifyMethod(method: Function, methodName: string, subscribe: (fn: any) => void) {
    const requestResolver = createRequestResolver();

    handleSubscribe(subscribe, requestResolver)

    return function promisifiedFunc(...args: any[]): Promise<any | void> {
        return new Promise((resolve, reject) => {
            const reqId = requestResolver.add({ resolve, reject });
            method(reqId, ...args);
        });
    };
}
