type CallbackFn<T> = (err: string | null, val?: T) => void
type OkCallback = CallbackFn<boolean>

const { cache: flyCache, data: flyData } = (window as any).fly

const handlers = {
  flyCacheDel: (key: string, cb: OkCallback) => {
    flyCache
      .del(key)
      .then(ok => cb(undefined, ok))
      .catch(err => cb(err, false))
  },
  flyCacheSet: (key: string, value: string | ArrayBuffer, options: any, cb: OkCallback) => {
    flyCache
      .set(key, value, convertCacheSetOptions(options))
      .then(ok => cb(undefined, ok))
      .catch(err => cb(err, false))
  },
  flyCacheGet: (key: string, cb: CallbackFn<ArrayBuffer | SharedArrayBuffer>) => {
    flyCache
      .get(key)
      .then(val => cb(undefined, val))
      .catch(err => cb(err, undefined))
  },
  flyCacheExpire: (key: string, ttl: number, cb: OkCallback) => {
    flyCache
      .expire(key, ttl)
      .then(ok => cb(undefined, ok))
      .catch(err => cb(err, false))
  },
  flyCacheGetMulti: notImplementedBridgeHandler,
  flyCacheSetTags: notImplementedBridgeHandler,
  flyCachePurgeTags: notImplementedBridgeHandler,
  flyCacheNotify: notImplementedBridgeHandler,

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

function notImplementedBridgeHandler(...args: Array<unknown>) {
  throw new Error(`Unimplemented nodeproxy bridge handler: ${JSON.stringify(args)}`)
}
