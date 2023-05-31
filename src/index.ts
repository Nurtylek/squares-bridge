import {LIB_VERSION} from "./version";

export interface SqBridge {
    version: string;
    getGeo: () => Promise<any>;
    isSupported: () => boolean;
    supports: (method: string) => boolean;
    showTestMessage: () => Promise<any>;
    showTestMessageWithoutPromise: () => any
}

const getGeoMethod = 'getGeo';
const showTestMessageMethod = 'showTestMessage';

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
        return Boolean(android || ios);
    }

    const supports = (method) =>
        (android && typeof android[method] === 'function') ||
        (ios && ios[method] && typeof ios[method].postMessage === 'function');

    const getGeo = () => {
        const isAndroid = android && android[getGeoMethod];
        const isIos = ios && ios[getGeoMethod];

        return new Promise((resolve, reject) => {
            if (isAndroid) {
                console.log("ANDROID getGeo");
                const res = android[getGeoMethod]();
                resolve(res ?? 'empty result');
            } else if (isIos) {
                ios[getGeoMethod].postMessage();
            } else if (typeof window !== 'undefined') {
                console.log('--getGeo-isUnknown');
            }
        })
    }

    const showTestMessage = () => {
        const isAndroid = android && android[showTestMessageMethod];
        const isIos = ios && ios[showTestMessageMethod];

        return new Promise((resolve, reject) => {
            if (isAndroid) {
                console.log("ANDROID showTestMessage");
                const res = android[showTestMessageMethod]();
                resolve(res ?? 'empty result');
            } else if (isIos) {
                ios[showTestMessageMethod].postMessage();
            } else if (typeof window !== 'undefined') {
                console.log('--getGeo-isUnknown');
            }
        })
    }

    const showTestMessageWithoutPromise = () => {
        const isAndroid = android && android[showTestMessageMethod];
        const isIos = ios && ios[showTestMessageMethod];

        if (isAndroid) {
            console.log("ANDROID showTestMessageWithoutPromise");
            android[showTestMessageMethod]();
        } else if (isIos) {
            ios[showTestMessageMethod].postMessage();
        } else if (typeof window !== 'undefined') {
            console.log('--getGeo-isUnknown');
        }
    }

    return  {
        version: String(LIB_VERSION),
        getGeo: getGeo,
        isSupported,
        supports,
        showTestMessage,
        showTestMessageWithoutPromise
    }
}

const bridge = buildBridge();

export default bridge;
