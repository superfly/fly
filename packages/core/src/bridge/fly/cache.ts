import { registerBridge } from '../'
import { ivm } from '../../'
import log from '../../log'
import { transferInto } from '../../utils/buffer'
import { Bridge } from '../bridge';
import { Runtime } from '../../runtime';
import { CacheOperation, isCacheOperation } from '../../cache_notifier';

const errCacheStoreUndefined = new Error("cacheStore is not defined in the config.")
const errCacheNotifierUndefined = new Error("cacheNotifier is not defined in the config")

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
  bridge.cacheStore.set(rt.app.id, key, buf, opts).then((ok) => {
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

  bridge.cacheStore.expire(rt.app.id, key, ttl).then((ok) => {
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

    bridge.cacheStore.get(rt.app.id, key).then((buf) => {
      rt.reportUsage("cache:get", { size: buf ? buf.byteLength : 0 })
      const b = transferInto(buf)
      callback.applyIgnored(null, [null, transferInto(buf)])
    }).catch((err) => {
      log.error("got err in cache.get", err)
      callback.applyIgnored(null, [null, null]) // swallow errors on get for now
    })
  })

registerBridge('flyCacheGetMulti',
  function cacheGet(rt: Runtime, bridge: Bridge, keys: string | string[], callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore) {
      callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
      return
    }

    if (typeof keys === "string") {
      keys = JSON.parse(keys) as string[]
    }
    bridge.cacheStore.getMulti(rt.app.id, keys).then((result) => {
      let byteLength = 0
      const toTransfer: (null | ivm.Copy<ArrayBuffer>)[] = result.map((b) => {
        byteLength += b ? b.byteLength : 0
        return transferInto(b)
      })
      toTransfer.unshift(null)
      rt.reportUsage("cache:get", { size: byteLength, keys: result.length })
      callback.applyIgnored(null, toTransfer)
    }).catch((err) => {
      log.error("got err in cache.getMulti", err)
      callback.applyIgnored(null, [null, null]) // swallow errors on get for now
    })
  })

registerBridge('flyCacheDel',
  function cacheDel(rt: Runtime, bridge: Bridge, key: string, callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore) {
      callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
      return
    }

    bridge.cacheStore.del(rt.app.id, key).then((result) => {
      callback.applyIgnored(null, [null, !!result])
    }).catch((err) => {
      log.error("got err in cache.del", err)
      callback.applyIgnored(null, [err.toString()])
    })
  })

registerBridge('flyCacheSetTags',
  function flyCaceSettTags(rt: Runtime, bridge: Bridge, key: string, tags: string[], callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore) {
      callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
      return
    }

    bridge.cacheStore.setTags(rt.app.id, key, tags).then((result) => {
      callback.applyIgnored(null, [null, result])
    }).catch((err) => {
      log.error("got err in cache.setTags", err)
      callback.applyIgnored(null, [err.toString()])
    })
  })

registerBridge('flyCachePurgeTags',
  function flyCacheSetTags(rt: Runtime, bridge: Bridge, key: string, callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore) {
      callback.applyIgnored(null, [errCacheStoreUndefined.toString()])
      return
    }

    bridge.cacheStore.purgeTag(rt.app.id, key).then((result) => {
      setImmediate(() => {
        callback.applyIgnored(null, [null, JSON.stringify(result)])
      })
    }).catch((err) => {
      log.error("got err in cache.purgeTags", err)
      callback.applyIgnored(null, [err.toString()])
    })
  })


registerBridge('flyCacheNotify',
  function cacheDel(rt: Runtime, bridge: Bridge, type: string | CacheOperation, key: string, callback: ivm.Reference<Function>) {
    if (!bridge.cacheStore || !bridge.cacheNotifier) {
      callback.applyIgnored(null, [errCacheNotifierUndefined.toString()])
      return
    }

    if (!isCacheOperation(type)) {
      callback.applyIgnored(null, ["Invalid cache notification type"])
      return
    }
    bridge.cacheNotifier.send(type, rt.app.id, key).then((result) => {
      callback.applyIgnored(null, [null, !!result])
    }).catch((err) => {
      log.error("got err in cacheNotify", err)
      callback.applyIgnored(null, [err.toString()])
    })
  })