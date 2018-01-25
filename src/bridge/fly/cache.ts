import { registerBridge, Context } from '../'
import { ivm } from '../../'
import log from '../../log'

import { conf } from '../../config'

const errCacheStoreUndefined = new Error("cacheStore is not defined in the config.")

registerBridge('flyCacheSet', function (ctx: Context) {
  return function cacheSet(key: string, value: string, ttl: number, callback: ivm.Reference<Function>) {
    let k = "cache:" + ctx.meta.get('app').id + ":" + key
    console.log("native cache set:", k, "ttl:", ttl, "size:", value.length)

    if (!conf.cacheStore)
      return callback.apply(null, [errCacheStoreUndefined.toString()])

    conf.cacheStore.set(k, value, ttl).then((ok) => {
      callback.apply(null, [null, ok])
    }).catch((err) => {
      callback.apply(null, [err.toString()])
    })
  }
})

registerBridge('flyCacheExpire', function (ctx: Context) {
  return function cacheExpire(key: string, ttl: number, callback: ivm.Reference<Function>) {
    let k = "cache:" + ctx.meta.get('app').id + ":" + key
    console.log("native cache expire:", k, "ttl:", ttl)

    if (!conf.cacheStore)
      return callback.apply(null, [errCacheStoreUndefined.toString()])

    conf.cacheStore.expire(k, ttl).then((ok) => {
      callback.apply(null, [null, ok])
    }).catch((err) => {
      callback.apply(null, [err.toString()])
    })
  }
})

registerBridge('flyCacheGetString', function (ctx: Context) {
  return function cacheGetString(key: string, callback: ivm.Reference<Function>) {
    let k = "cache:" + ctx.meta.get('app').id + ":" + key
    console.log("native cache get: " + k)

    if (!conf.cacheStore)
      return callback.apply(null, [errCacheStoreUndefined.toString()])

    conf.cacheStore.get(k).then((buf) => {
      const ret = buf ? buf.toString() : null
      callback.apply(null, [null, ret])

    }).catch((err) => {
      callback.apply(null, [err.toString()])
    })
  }
})