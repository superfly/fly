import { registerBridge, Context } from './'
import * as ivm from 'isolated-vm'
import * as http from 'http'
import log from '../log'
import { fetchBridge } from './fetch'

const getStream = require('get-stream')

const CachePolicy = require('http-cache-semantics')

// TODO: Redis, you know.
let cache: { [key: string]: any } = {}

registerBridge('cacheMatch', function (ctx: Context) {
  return function (request: any, callback: ivm.Reference<Function>) {
    const key = `${ctx.meta.get('app').id}:${request.url}`
    log.debug("cache match called! key:", key)
    const found = cache[key]
    log.debug("found:", found)
    if (!found)
      return callback.apply(null, [null, null])

    const { rawPolicy, response } = found
    let policy = CachePolicy.fromObject(rawPolicy)
    log.debug("satisfactory?", policy.satisfiesWithoutRevalidation(request))
    if (policy && policy.satisfiesWithoutRevalidation(request)) {
      response.headers = policy.responseHeaders();
      log.debug("sending response", JSON.stringify(response))
      return callback.apply(null, [null, new ivm.ExternalCopy(response).copyInto()]);
    }

    return callback.apply(null, [null, null])
  }
})

registerBridge('cacheAdd', function (ctx: Context) {
  const fetch = fetchBridge(ctx)
  return function (request: any, body: ArrayBuffer, callback: ivm.Reference<Function>) {
    const key = `${ctx.meta.get('app').id}:${request.url}`
    log.debug("cache add called! key:", key)

    fetch(request.url, {
      method: request.method,
      headers: request.headers
    }, body, new ivm.Reference(function (err: Error | null, res: ivm.ExternalCopy<any>, body: ivm.Reference<Function>, proxied: ivm.Reference<http.IncomingMessage>) {
      log.debug("cache add fetch called callback, nice.", arguments)
      if (err)
        return callback.apply(null, [err.toString()])
      let bodyStream = proxied.deref()
      bodyStream.resume()

      getStream(bodyStream).then((bodyStr: string) => {
        log.debug("cache add got full body now", bodyStr)
        const copiedRes = res.copy()
        log.debug("copied res:", copiedRes)
        let cacheableRes = {
          status: copiedRes.status,
          headers: copiedRes.headers,
          body: bodyStr,
        }
        const policy = new CachePolicy({
          url: request.url,
          method: request.method,
          headers: request.headers || {},
        }, cacheableRes)
        if (policy.storable())
          cache[key] = { rawPolicy: policy.toObject(), response: cacheableRes }
        return callback.apply(null, [null, res, bodyStr])
      }).catch((err: Error) => {
        callback.apply(null, [err.toString()])
      })
    }))
  }
})