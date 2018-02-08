import { registerBridge, Context } from './'
import { ivm } from '../'
import * as http from 'http'
import log from '../log'
import { fetchBridge } from './fetch'
import { transferInto } from '../utils/buffer';

const CachePolicy = require('http-cache-semantics')

// TODO: Use config.cacheStore
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
      const body = response.body
      delete response.body
      return callback.apply(null, [null, new ivm.ExternalCopy(response).copyInto(), transferInto(body)]);
    }

    return callback.apply(null, [null, null])
  }
})

registerBridge("cachePut", function (ctx: Context) {
  return function (req: any, res: any, resBody: ArrayBuffer, callback: ivm.Reference<Function>) {
    try {
      const key = `${ctx.meta.get('app').id}:${req.url}`

      let resHeaders: any = {}
      for (const k of Object.keys(res.headers)) {
        if (k === 'set-cookie')
          resHeaders[k] = res.headers[k]
        else
          resHeaders[k] = res.headers[k].join(',')
      }

      let cacheableRes = {
        status: res.status,
        headers: resHeaders,
        body: resBody,
      }
      const policy = new CachePolicy({
        url: req.url,
        method: req.method,
        headers: req.headers || {},
      }, cacheableRes)
      if (policy.storable())
        cache[key] = { rawPolicy: policy.toObject(), response: cacheableRes }
      callback.apply(null, [])
    } catch (e) {
      log.error("got error putting cache", e)
      callback.apply(null, [e.toString()])
    }

  }
})