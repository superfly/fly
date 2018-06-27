/**
 * Per region data cache API.
 * 
 * @preferred
 * @module fly/cache
 */


export function get(key: string) {
  return new Promise<ArrayBuffer | null>(function cacheGetPromise(resolve, reject) {
    bridge.dispatch(
      "flyCacheGet",
      key,
      function cacheGetCallback(err: string | null | undefined, value?: ArrayBuffer) {
        if (err != null) {
          reject(err)
          return
        }
        resolve(value)
      }
    )
  })
}
export async function getString(key: string) {
  const buf = await get(key)
  if (!buf) { return buf }
  return new TextDecoder("utf-8").decode(buf)
}

export function set(key: string, value: string | ArrayBuffer, ttl?: number) {
  return new Promise<boolean>(function cacheSetPromise(resolve, reject) {
    bridge.dispatch("flyCacheSet", key, value, ttl, function cacheSetCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

export function expire(key: string, ttl: number) {
  return new Promise<boolean>(function cacheSetPromise(resolve, reject) {
    bridge.dispatch("flyCacheExpire", key, ttl, function cacheSetCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

const cache = {
  get,
  getString,
  set,
  expire
}
export default cache