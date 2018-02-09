import { registerBridge, Context } from './'
import { ivm, Config } from '../'
import * as http from 'http'
import log from '../log'
import { fetchBridge } from './fetch'
import { transferInto } from '../utils/buffer';
import { createHash } from 'crypto';
import { URL } from 'url';

const CachePolicy = require('http-cache-semantics')

const errCacheStoreUndefined = new Error("cacheStore is not defined in the config.")

registerBridge('cacheMatch', function (ctx: Context, config: Config) {
  return function (req: any, callback: ivm.Reference<Function>) {
    if (!config.cacheStore)
      return callback.apply(null, [errCacheStoreUndefined.toString()])

    const hashed = hashRequest(req, ctx)
    const appId = ctx.meta.get('app').id
    const key = `local:httpcache:meta:${appId}:${hashed}`
    log.debug("cache match called! key:", key)

    config.cacheStore.get(key).then((meta) => {
      if (!meta)
        return callback.apply(null, [])

      const policy = CachePolicy.fromObject(JSON.parse(meta.toString()))
      if (policy && policy.satisfiesWithoutRevalidation(req)) {
        const resKey = `local:httpcache:response:${appId}:${hashed}`
        config.cacheStore.get(resKey).then((resBuf) => {
          if (!resBuf)
            return callback.apply(null, [])
          const res = JSON.parse(resBuf.toString())
          res.headers = policy.responseHeaders()
          const bodyKey = `local:httpcache:body:${appId}:${hashed}`
          config.cacheStore.get(bodyKey).then((body) => {
            return callback.apply(null, [null, new ivm.ExternalCopy(res).copyInto(), transferInto(body)]);
          })
        })
      }
    })
  }
})

registerBridge("cachePut", function (ctx: Context, config: Config) {
  return function (req: any, res: any, resBody: ArrayBuffer, callback: ivm.Reference<Function>) {
    if (!config.cacheStore)
      return callback.apply(null, [errCacheStoreUndefined.toString()])
    try {
      const hashed = hashRequest(req, ctx)
      const appId = ctx.meta.get('app').id
      const key = `local:httpcache:meta:${appId}:${hashed}`

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
      }
      const policy = new CachePolicy({
        url: req.url,
        method: req.method,
        headers: req.headers || {},
      }, cacheableRes)
      if (policy.storable()) {
        const ttl = Math.floor(policy.timeToLive() / 1000)
        config.cacheStore.set(key, JSON.stringify(policy.toObject()), ttl).then(() => {
          const resKey = `local:httpcache:response:${appId}:${hashed}`
          config.cacheStore.set(resKey, JSON.stringify(cacheableRes), ttl).then(() => {
            const bodyKey = `local:httpcache:body:${appId}:${hashed}`
            config.cacheStore.set(bodyKey, Buffer.from(resBody), ttl).then(() => {
              callback.apply(null, [])
            })
          })
        })
      }
    } catch (e) {
      log.error("got error putting cache", e)
      callback.apply(null, [e.toString()])
    }

  }
})

function hashRequest(req: any, ctx: Context): string {
  let h = createHash("SHA1")
  let toHash = ``

  const u = normalizeURL(req.url)
  if (!u.host)
    u.host = ctx.meta.get("originalHost")

  toHash += u.toString()
  toHash += req.method

  // TODO: cacheable cookies
  // TODO: cache version for grand busting

  h.update(toHash)
  return h.digest('hex')
}

function normalizeURL(u: string) {
  let url = new URL(u)
  url.hash = ""
  const sp = url.searchParams
  sp.sort()
  url.search = sp.toString()
  return url
}