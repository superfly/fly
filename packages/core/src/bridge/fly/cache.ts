import { registerBridge } from '../'
import { ivm } from '../../'
import log from '../../log'
import { transferInto } from '../../utils/buffer'
import { Bridge } from '../bridge';
import { Runtime } from '../../runtime';

const errCacheStoreUndefined = new Error("cacheStore is not defined in the config.")

registerBridge('flyCacheSet', function cacheSet(rt: Runtime, bridge: Bridge, key: string, value: ArrayBuffer | string, options: string | undefined, callback: ivm.Reference<Function>) {
  if (!bridge.cacheStore) {
    callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
    return
  }

  const opts = options && JSON.parse(options) || undefined

  let buf: Buffer
  try {
    if (value instanceof ArrayBuffer) {
      buf = Buffer.from(value)
    } else {
      // handle strings and garbage inputs reasonably
      buf = Buffer.from(value.toString(), "utf8")
    }
  } catch (err) {
    callback.applyIgnored(null, [err.toString()])
    return
  }
  bridge.cacheStore.set(rt, key, buf, opts).then((ok) => {
    rt.reportUsage("cache:set", { size: buf.byteLength })
    callback.applyIgnored(null, [null, ok])
  }).catch((err) => {
    log.error(err)
    callback.applyIgnored(null, [err.toString()])
  })
  return
})

registerBridge('flyCacheExpire', function cacheExpire(rt: Runtime, bridge: Bridge, key: string, ttl: number, callback: ivm.Reference<Function>) {
  if (!bridge.cacheStore) {
    callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
    return
  }

  bridge.cacheStore.expire(rt, key, ttl).then((ok) => {
    callback.applyIgnored(null, [null, ok])
  }).catch((err) => {
    callback.applyIgnored(null, [err.toString()])
  })
})

registerBridge('flyCacheGet',
  function cacheGet(rt: Runtime, bridge: Bridge, key: string, callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore) {
      callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
      return
    }

    bridge.cacheStore.get(rt, key).then((buf) => {
      rt.reportUsage("cache:get", { size: buf ? buf.byteLength : 0 })
      callback.applyIgnored(null, [null, transferInto(buf)])
    }).catch((err) => {
      log.error("got err in cache.get", err)
      callback.applyIgnored(null, [null, null]) // swallow errors on get for now
    })
  })

registerBridge('flyCacheDel',
  function cacheDel(rt: Runtime, bridge: Bridge, key: string, callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore) {
      callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
      return
    }

    bridge.cacheStore.del(rt, key).then((result) => {
      callback.applyIgnored(null, [null, !!result])
    }).catch((err) => {
      log.error("got err in cache.del", err)
      callback.applyIgnored(null, [null, null]) // swallow errors on get for now
    })
  })

registerBridge('flyCacheSetTags',
  function flyCaceSettTags(rt: Runtime, bridge: Bridge, key: string, tags: string[], callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore) {
      callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
      return
    }

    bridge.cacheStore.setTags(rt, key, tags).then((result) => {
      callback.applyIgnored(null, [null, result])
    }).catch((err) => {
      log.error("got err in cache.setTags", err)
      callback.applyIgnored(null, [null, null]) // swallow errors on get for now
    })
  })

registerBridge('flyCachePurgeTags',
  function flyCacheSetTags(rt: Runtime, bridge: Bridge, key: string, callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore) {
      callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
      return
    }

    bridge.cacheStore.purgeTags(rt, key).then((result) => {
      setImmediate(() => {
        callback.applyIgnored(null, [null, JSON.stringify(result)])
      })
    }).catch((err) => {
      log.error("got err in cache.purgeTags", err)
      callback.applyIgnored(null, [null, null]) // swallow errors on get for now
    })
  })
