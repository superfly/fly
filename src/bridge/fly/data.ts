import log from '../../log'

import { ivm } from '../..';

import { registerBridge } from '..';
import { Context } from '../../context';
import { Bridge } from '../bridge';

registerBridge("fly.Data.put", function (ctx: Context, bridge: Bridge, collName: string, key: string, obj: string, cb: ivm.Reference<Function>) {
  ctx.addCallback(cb)
  if (!bridge.dataStore) {
    log.error("Data store was not present")
    ctx.applyCallback(cb, ["data store not present, this is a bug, please report!"])
    return
  }
  bridge.dataStore.collection(collName).then((coll) => {
    coll.put(key, obj)
      .then((ok) => {
        ctx.applyCallback(cb, [null, ok])
      })
      .catch((err) => {
        log.error("Error putting data:", err.toString())
        ctx.applyCallback(cb, ["error putting data"])
      })
  }).catch((err) => {
    log.error("Error getting or making collection:", err.toString())
    ctx.applyCallback(cb, ["error getting or making collection"])
  })
})

registerBridge("fly.Data.get", function (ctx: Context, bridge: Bridge, collName: string, key: string, cb: ivm.Reference<Function>) {
  ctx.addCallback(cb)
  if (!bridge.dataStore) {
    log.error("Data store was not present")
    ctx.applyCallback(cb, ["data store not present, this is a bug, please report!"])
    return
  }

  bridge.dataStore.collection(collName).then((coll) => {
    coll.get(key)
      .then((res) => {
        ctx.applyCallback(cb, [null, res ? res.obj : null])
      })
      .catch((err) => {
        log.error("Error getting data:", err.toString())
        ctx.applyCallback(cb, ["error getting data"])
      })
  }).catch((err) => {
    log.error("Error getting or making collection:", err.toString())
    ctx.applyCallback(cb, ["error getting or making collection"])
  })
})

registerBridge("fly.Data.dropCollection", function (ctx: Context, bridge: Bridge, collName: string, cb: ivm.Reference<Function>) {
  ctx.addCallback(cb)
  if (!bridge.dataStore) {
    log.error("Data store was not present")
    ctx.applyCallback(cb, ["data store not present, this is a bug, please report!"])
    return
  }

  bridge.dataStore.dropCollection(collName)
    .then(() => {
      ctx.applyCallback(cb, [])
    }).catch((err) => {
      log.error("Error dropping collection:", err.toString())
      ctx.applyCallback(cb, ["error dropping collection"])
    })
})

registerBridge("fly.Data.del", function (ctx: Context, bridge: Bridge, collName: string, key: string, cb: ivm.Reference<Function>) {
  ctx.addCallback(cb)
  if (!bridge.dataStore) {
    log.error("Data store was not present")
    ctx.applyCallback(cb, ["data store not present, this is a bug, please report!"])
    return
  }

  bridge.dataStore.collection(collName).then((coll) => {
    coll.del(key)
      .then((ok) => {
        ctx.applyCallback(cb, [null, ok])
      })
      .catch((err) => {
        log.error("Error deleting data:", err.toString())
        ctx.applyCallback(cb, ["error deleting data"])
      })
  }).catch((err) => {
    log.error("Error getting or making collection:", err.toString())
    ctx.applyCallback(cb, ["error getting or making collection"])
  })
})