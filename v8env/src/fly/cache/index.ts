/**
 * An API for accessing a regional, volatile cache. Data stored in `@fly/cache` can have an associated per-key time to live (TTL), and we will evict key data automatically after the elapsed TTL. We will also evict unused data when we need to reclaim space.
 * 
 * ```javascript
 * import cache from "@fly/cache"
 * 
 * await cache.set("test-key", "test-value")
 * 
 * const s = await cache.getString("test-key")
 * ```
 * 
 * See {@link fly/cache/response} for caching HTTP Response objects.
 * 
 * See {@link fly/cache/global} for global cache del/purge
 * 
 * @preferred
 * @module fly/cache
 */

/** */
declare var bridge: any
export interface CacheSetOptions {
  ttl?: number,
  tags?: string[],
  onlyIfEmpty?: boolean
}


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
  if (!buf) { return null }
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
export function set(key: string, value: string | ArrayBuffer, options?: CacheSetOptions | number) {
  if (typeof value !== "string" && !(value instanceof ArrayBuffer)) {
    throw new Error("Cache values must be either a string or array buffer")
  }
  return new Promise<boolean>(function cacheSetPromise(resolve, reject) {
    bridge.dispatch("flyCacheSet", key, value, options && JSON.stringify(options), function cacheSetCallback(err: string | null, ok?: boolean) {
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
 * Replace tags for a given cache key
 * @param key The key to modify
 * @param tags Tags to apply to key
 * @returns true if tags were successfully updated
 */
export function setTags(key: string, tags: string[]) {
  return new Promise<boolean>(function cacheSetTagsPromise(resolve, reject) {
    bridge.dispatch("flyCacheSetTags", key, tags, function cacheSetTagsCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

/**
 * Purges all cache entries with the given tag
 * @param tag Tag to purge
 */
export function purgeTag(tag: string) {
  return new Promise<string[]>(function cachePurgeTagsPromise(resolve, reject) {
    bridge.dispatch("flyCachePurgeTags", tag, function cachePurgeTagsCallback(err: string | null, keys?: string) {
      if (err != null || !keys) {
        reject(err || "weird result")
        return
      }
      const result = JSON.parse(keys)
      if (result instanceof Array) {
        resolve(<string[]>result)
        return
      } else {
        reject("got back gibberish")
      }
    })
  })
}


/**
 * Deletes the value (if any) at the specified key
 * @param key Key to delete
 * @returns true if delete was successful
 */
export function del(key: string) {
  return new Promise<boolean>(function cacheDelPromise(resolve, reject) {
    bridge.dispatch("flyCacheDel", key, function cacheDelCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

/**
 * A library for caching/retrieving Response objects
 * 
 * See {@link fly/cache/response}
 */
export { default as responseCache } from "./response"

/**
 * API for sending global cache notifications
 * 
 * See {@link fly/cache/global} 
 */
import { default as global } from "./global"

const cache = {
  get,
  getString,
  set,
  expire,
  del,
  setTags,
  purgeTag,
  global
}
export default cache