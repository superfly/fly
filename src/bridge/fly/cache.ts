import { registerBridge } from '../'
import { ivm } from '../../'
import log from '../../log'
import { Trace } from '../../trace'
import { Config, Context } from '../../';
import { transferInto } from '../../utils/buffer'

const errCacheStoreUndefined = new Error("cacheStore is not defined in the config.")

registerBridge('flyCacheSet', function cacheSet(ctx: Context, config: Config, key: string, value: string | ArrayBuffer | Buffer, ttl: number, callback: ivm.Reference<Function>) {
  let t = Trace.tryStart("cacheSet", ctx.trace)
  ctx.addCallback(callback)
  if (!ctx.meta.app)
    return ctx.tryCallback(callback, ["app not present, something is wrong"])

  let k = "cache:" + ctx.meta.app.id + ":" + key

  if (!config.cacheStore)
    return ctx.tryCallback(callback, [errCacheStoreUndefined.toString()])

  let size = 0
  if (value instanceof ArrayBuffer) {
    log.debug("Setting buffer in cache:", key, value.constructor.name, value.byteLength, ttl)
    size = value.byteLength
    value = Buffer.from(value)
  } else {
    size = value.length
  }
  config.cacheStore.set(k, value, ttl).then((ok) => {
    t.end({ size: size, key: key })
    ctx.tryCallback(callback, [null, ok])
  }).catch((err) => {
    log.error(err)
    t.end()
    ctx.tryCallback(callback, [err.toString()])
  })
  return
})

registerBridge('flyCacheExpire', function cacheExpire(ctx: Context, config: Config, key: string, ttl: number, callback: ivm.Reference<Function>) {
  let t = Trace.tryStart("cacheExpire", ctx.trace)
  ctx.addCallback(callback)
  if (!ctx.meta.app)
    return ctx.tryCallback(callback, ["app not present, something is wrong"])
  let k = "cache:" + ctx.meta.app.id + ":" + key

  if (!config.cacheStore) {
    ctx.tryCallback(callback, [errCacheStoreUndefined.toString()])
    return
  }

  config.cacheStore.expire(k, ttl).then((ok) => {
    t.end({ key: key })
    ctx.applyCallback(callback, [null, ok])
  }).catch((err) => {
    t.end()
    ctx.tryCallback(callback, [err.toString()])
  })
})

registerBridge('flyCacheGet',
  function cacheGet(ctx: Context, config: Config, key: string, callback: ivm.Reference<Function>) {
    let t = Trace.tryStart("cacheGet", ctx.trace)
    ctx.addCallback(callback)
    if (!ctx.meta.app)
      return ctx.tryCallback(callback, ["app not present, something is wrong"])

    if (!config.cacheStore) {
      ctx.tryCallback(callback, [errCacheStoreUndefined.toString()])
      return
    }
    let k = "cache:" + ctx.meta.app.id + ":" + key

    config.cacheStore.get(k).then((buf) => {
      const size = buf ? buf.byteLength : 0
      t.end({ size: size, key: key })
      ctx.applyCallback(callback, [null, transferInto(buf)])
    }).catch((err) => {
      log.error("got err in cache.get", err)
      t.end()
      ctx.tryCallback(callback, [err.toString()])
    })
  })