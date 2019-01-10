type CallbackFn<T> = (err: string | null, val?: T) => void
type OkCallback = CallbackFn<boolean>

const { cache: flyCache, data: flyData } = (window as any).fly

const handlers = {
  flyCacheDel: (key: string, cb: OkCallback) => {
    flyCache
      .del(key)
      .then(ok => cb(null, ok))
      .catch(err => cb(err, false))
  },
  flyCacheSet: (key: string, value: string | ArrayBuffer, options: any, cb: OkCallback) => {
    flyCache
      .set(key, value, convertCacheSetOptions(options))
      .then(ok => cb(null, ok))
      .catch(err => cb(err, false))
  },
  flyCacheGet: (key: string, cb: CallbackFn<ArrayBuffer | SharedArrayBuffer>) => {
    flyCache
      .get(key)
      .then(val => cb(null, val))
      .catch(err => cb(err, undefined))
  },
  flyCacheExpire: (key: string, ttl: number, cb: OkCallback) => {
    flyCache
      .expire(key, ttl)
      .then(ok => cb(null, ok))
      .catch(err => cb(err, false))
  },
  flyCacheGetMulti: (jsonKeys: string, cb: CallbackFn<Array<ArrayBuffer | SharedArrayBuffer | null>>) => {
    const keys = JSON.parse(jsonKeys)
    Promise.all(keys.map(k => flyCache.get(k)))
      .then(values => cb(null, values as any))
      .catch(err => cb(err, undefined))
  },
  flyCacheSetTags: (key: string, tags: string[], cb: OkCallback) => {
    flyCache
      .setTags(key, tags)
      .then(ok => cb(null, ok))
      .catch(err => cb(err, false))
  },
  flyCachePurgeTags: (tag: string, cb: CallbackFn<string>) => {
    // nodeproxy returned an array of purged tags on success, rustproxy returns an ok bool
    // JSON serialize an empty array so the v8env bridge resolves the promise
    flyCache
      .purgeTag(tag)
      .then(ok => cb(null, JSON.stringify([])))
      .catch(err => cb(err, undefined))
  },
  flyCacheNotify: (op: string, keyOrTag: string, cb: OkCallback) => {
    if (op === "del") {
      flyCache.global
        .del(keyOrTag)
        .then(ok => cb(null, ok))
        .catch(err => cb(err, false))
    } else if (op === "purgeTag") {
      flyCache.global
        .purgeTag(keyOrTag)
        .then(ok => cb(null, ok))
        .catch(err => cb(err, false))
    } else {
      cb(`unknown operation ${op}`, false)
    }
  },

  "fly.Data.put": (collectionName: string, key: string, obj: string, cb: OkCallback) => {
    flyData
      .collection(collectionName)
      .put(key, JSON.parse(obj))
      .then(ok => cb(undefined, ok))
      .catch(err => cb(err, false))
  },
  "fly.Data.get": (collectionName: string, key: string, cb: CallbackFn<any>) => {
    flyData
      .collection(collectionName)
      .get(key)
      .then(val => cb(undefined, JSON.stringify(val)))
      .catch(err => cb(err, false))
  },
  "fly.Data.del": (collectionName: string, key: string, cb: OkCallback) => {
    flyData
      .collection(collectionName)
      .del(key)
      .then(ok => cb(undefined, ok))
      .catch(err => cb(err, false))
  },
  "fly.Data.dropCollection": (collectionName: string, cb: OkCallback) => {
    flyData
      .dropCollection(collectionName)
      .then(ok => cb(undefined, ok))
      .catch(err => cb(err, false))
  }
}

export function dispatch(name: string, ...args: Array<unknown>) {
  console.log("nodeproxy bridge dispatch", { name, args })

  const handler = handlers[name]
  if (!handler) {
    throw new Error(`Unhandled nodeproxy bridge invocation: ${name}`)
  }

  handler(...args)
}

function convertCacheSetOptions(options: unknown) {
  if (!options) {
    return undefined
  }

  if (typeof options === "string") {
    const parsedOptions = JSON.parse(options)

    if (typeof parsedOptions === "number") {
      return {
        ttl: parsedOptions
      }
    } else if (parsedOptions !== null && typeof parsedOptions === "object") {
      return parsedOptions
    }
  }

  console.warn(
    "Expected flyCacheSet options to be undefined or JSON serialized number or CacheSetOptions, got:",
    options
  )
  return undefined
}
