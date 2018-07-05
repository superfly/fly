/**
 * An API for accessing a regional, volatile cache. Data stored in the `fly.cache` can have an associated per-key time to live (TTL), and we will evict key data automatically after the elapsed TTL. We will also evict unused data periodically.
 * 
 * @preferred
 * @module fly/cache
 */


/**
 * Get an ArrayBuffer value (or null) from the cache
 * @param key The key to get
 * @return Raw bytes stored for provided key or null if empty.
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

/**
 * Get a string value (or null) from the cache
 *
 * @param key The key to get
 * @returns Data stored at the key, or null if none exists
 */
export async function getString(key: string) {
  const buf = await get(key)
  if (!buf) { return buf }
  try {
    return new TextDecoder("utf-8").decode(buf)
  } catch (err) {
    return null
  }
}

/**
 * Sets a value at the specified key, with an optional ttl
 * @param key The key to add or overwrite
 * @param value Data to store at the specified key, up to 2MB
 * @param ttl Time to live (in seconds)
 * @returns true if the set was successful
 */
export function set(key: string, value: string | ArrayBuffer, ttl?: number) {
  if (typeof value !== "string" && !(value instanceof ArrayBuffer)) {
    throw new Error("Cache values must be either a string or array buffer")
  }
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

/**
 * Add or overwrite a key's  time to live
 * @param key The key to modify
 * @param ttl Expiration time remaining in seconds
 * @returns true if ttl was successfully updated
 */
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

/**
 * Deletes the value (if any) at the specified key
 * @param key Key to delete
 * @returns true if delete was successful
 */
export function del(key: string) {
  return expire(key, 0)
}

const cache = {
  get,
  getString,
  set,
  expire,
  del
}
export default cache