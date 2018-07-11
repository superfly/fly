import { assert } from "./helpers"
import cache from "@fly/cache"

interface fly {
    cache: {
        get: (key: string) => Promise<ArrayBuffer | null>,
        getString: (key: string) => Promise<string | null>,
        set: (key: string, value: ArrayBuffer | string, ttl?: number) => Promise<boolean>,
    }
}
declare var fly: fly

export interface HandlerFunc {
    (request: Request): Promise<Response>
}

export interface ClientIdFunc {
    (request: Request): string
}

export function remoteAddressClientId(request: Request): string {
    return (<any>request).remoteAddr
}

export function defaultFailureHandler(request: Request): Promise<Response> {
    return Promise.resolve(new Response("Request limit exceeded", { status: 429 }))
}

export interface Options {
    requestLimit: number,
    timePeriod: number,
    clientId?: ClientIdFunc,
    failureHandler?: HandlerFunc,
}

export function throttle(handler: HandlerFunc, options: Options): HandlerFunc {
    assert(typeof options.requestLimit === "number", "options.requestLimit must be a number")
    assert(typeof options.timePeriod === "number", "options.timePeriod must be a number")

    const requestLimit = options.requestLimit
    const timePeriod = options.timePeriod
    const clientIdFunc = options.clientId || remoteAddressClientId
    const failureHandler = options.failureHandler || defaultFailureHandler

    return async function (request: Request): Promise<Response> {
        const [timeBucket, timeRemaining] = bucketForTimePeriod(timePeriod)
        const clientId = clientIdFunc(request)

        const key = `throttle:${timeBucket}:${clientId}`
        const requestCount = await incr(key, timePeriod)
        const requestsRemaining = requestLimit - requestCount
        const requestHandler = requestsRemaining < 0 ? failureHandler : handler
        const response = await requestHandler(request);

        response.headers.append("X-RateLimit-Limit", requestLimit.toString())
        response.headers.append("X-RateLimit-Remaining", Math.max(0, requestsRemaining).toString())
        response.headers.append("X-RateLimit-Reset", timeRemaining.toString())

        return response
    }
}

async function incr(key: string, ttl: number): Promise<number> {
    var rawCount = await cache.getString(key)
    var requestCount = rawCount == null ? 0 : parseInt(rawCount)
    requestCount++
    cache.set(key, requestCount.toString(), ttl) // don't block request awaiting set
    return requestCount
}

function bucketForTimePeriod(timePeriod: number): [number, number] {
    var now = Date.now() / 1000
    var bucket = timePeriod * Math.ceil(now / timePeriod)
    var remaining = Math.ceil(bucket - now)
    return [bucket, remaining]
}
