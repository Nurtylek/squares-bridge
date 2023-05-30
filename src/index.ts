import {LIB_VERSION} from "./version";
import {promisifyMethod} from "./utils";

export interface SqBridge {
    version: string;
    getGeo: () => Promise<GetGeoResponse>;
    isSupported: () => boolean;
    supports: (method: string) => boolean;
}

const getGeoMethod = 'getGeo';

interface GetGeoResponse {
    latitude: number;
    longitude: number;
}

declare global {
    interface Window {
        AndroidBridge: any;
        webkit: {
            messageHandlers: any
        }
    }
}

const android = typeof window !== 'undefined' && window.AndroidBridge;
const ios = typeof window !== 'undefined' && window?.webkit?.messageHandlers;

const buildBridge = (): SqBridge => {
    const subs = [];

    const sub = (listener: any) => {
        subs.push(listener);
    }

    const isSupported = () => {
        const iosSup = ios && window.webkit.messageHandlers.invoke;
        return Boolean(android || iosSup);
    }

    const supports = (method) =>
        (android && typeof android[method] === 'function') ||
        (ios && ios[method] && typeof ios[method].postMessage === 'function');

    const getGeo = (reqId) => {
        const isAndroid = android && android[getGeoMethod];
        const isIos = ios && ios[getGeoMethod];

        if (isAndroid) {
            android[getGeoMethod](reqId);
        } else if (isIos) {
            ios[getGeoMethod].postMessage({ reqId });
        } else if (typeof window !== 'undefined') {
            console.log('--getGeo-isUnknown');
        }
    }

    const getGeoPromise = promisifyMethod(getGeo, getGeoMethod, sub);

    return  {
        version: String(LIB_VERSION),
        getGeo: getGeoPromise,
        isSupported,
        supports,
    }
}

const bridge = buildBridge();

export default bridge;
