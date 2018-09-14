/**
 * @module fly
 * @private
 */
// These declarations are shims to help the transition to typescript. If they
// are still here by 8/9 please hastle md

// TODO: tee() isn't defined on the inbuilt dom lib. Remove this interfae when
// this is merged: https://github.com/Microsoft/TSJS-lib-generator/pull/541
declare interface ReadableStream {
    tee(): [ReadableStream, ReadableStream];
}

declare interface Headers {
    toJSON(): any
    getAll(name: string): string[]
}

declare interface Request {
    bodySource: any
}

declare interface SubtleCrypto {
    digestSync(algo: string, data: any, encoding?: string): ArrayBuffer | string
}

declare interface URLSearchParams {
    sort()
}

declare module NodeJS {
    interface Global {
        bridge: any
        middleware: {}
        bootstrapBridge: any
        bootstrap: any
        fly: any
        console: any
        fireFetchEvent: any
        addEventListener: any
        dispatchEvent: any
        FetchEvent: any
        Document: any
        Element: any
        getHeapStatistics: any
    }
}