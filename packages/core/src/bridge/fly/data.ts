import log from "../../log"

import { ivm } from "../.."

import { registerBridge } from ".."
import { Bridge } from "../bridge"
import { Runtime } from "../../runtime"

registerBridge("fly.Data.put", function(
  rt: Runtime,
  bridge: Bridge,
  collName: string,
  key: string,
  obj: string,
  cb: ivm.Reference<Function>
) {
  if (!bridge.dataStore) {
    log.error("Data store was not present")
    cb.applyIgnored(null, ["data store not present, this is a bug, please report!"])
    return
  }
  bridge.dataStore
    .collection(rt, collName)
    .then(coll => {
      coll
        .put(rt, key, obj)
        .then(ok => {
          cb.applyIgnored(null, [null, ok])
        })
        .catch(err => {
          log.error("Error putting data:", err.toString())
          cb.applyIgnored(null, ["error putting data"])
        })
    })
    .catch(err => {
      log.error("Error getting or making collection:", err.toString())
      cb.applyIgnored(null, ["error getting or making collection"])
    })
})

registerBridge("fly.Data.get", function(
  rt: Runtime,
  bridge: Bridge,
  collName: string,
  key: string,
  cb: ivm.Reference<Function>
) {
  if (!bridge.dataStore) {
    log.error("Data store was not present")
    cb.applyIgnored(null, ["data store not present, this is a bug, please report!"])
    return
  }

  bridge.dataStore
    .collection(rt, collName)
    .then(coll => {
      coll
        .get(rt, key)
        .then(res => {
          cb.applyIgnored(null, [null, res ? res.obj : null])
        })
        .catch(err => {
          log.error("Error getting data:", err.toString())
          cb.applyIgnored(null, ["error getting data"])
        })
    })
    .catch(err => {
      log.error("Error getting or making collection:", err.toString())
      cb.applyIgnored(null, ["error getting or making collection"])
    })
})

registerBridge("fly.Data.dropCollection", function(
  rt: Runtime,
  bridge: Bridge,
  collName: string,
  cb: ivm.Reference<Function>
) {
  if (!bridge.dataStore) {
    log.error("Data store was not present")
    cb.applyIgnored(null, ["data store not present, this is a bug, please report!"])
    return
  }

  bridge.dataStore
    .dropCollection(rt, collName)
    .then(() => {
      cb.applyIgnored(null, [])
    })
    .catch(err => {
      log.error("Error dropping collection:", err.toString())
      cb.applyIgnored(null, ["error dropping collection"])
    })
})

registerBridge("fly.Data.del", function(
  rt: Runtime,
  bridge: Bridge,
  collName: string,
  key: string,
  cb: ivm.Reference<Function>
) {
  if (!bridge.dataStore) {
    log.error("Data store was not present")
    cb.applyIgnored(null, ["data store not present, this is a bug, please report!"])
    return
  }

  bridge.dataStore
    .collection(rt, collName)
    .then(coll => {
      coll
        .del(rt, key)
        .then(ok => {
          cb.applyIgnored(null, [null, ok])
        })
        .catch(err => {
          log.error("Error deleting data:", err.toString())
          cb.applyIgnored(null, ["error deleting data"])
        })
    })
    .catch(err => {
      log.error("Error getting or making collection:", err.toString())
      cb.applyIgnored(null, ["error getting or making collection"])
    })
})
