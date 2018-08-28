/**
 * The Fly global cache API, allows eventually consistent modifications to all caches in all regions.
 * 
 * ```javascript
 * import cache from "@fly/cache"
 * 
 * // notify all caches to delete a key
 * await cache.global.del("key-to-delete")
 * 
 * // notify all caches to purge a tag
 * await cache.global.purgeTag("key-to-purge")
 * ```
 * 
 * @module fly/cache/global
 */
/**  */
declare var bridge: any

/**
 * Notifies all caches to delete data at the specified key.
 * @param key the key to delete
 * @returns A promise that resolves as soon as the del notification is sent. Since regional caches are
 *  eventually consisten, this may return before every cache is updated.
 */
export async function del(key: string): Promise<boolean> {
  return new Promise<boolean>(function globalDelPromise(resolve, reject) {
    bridge.dispatch("flyCacheNotify", "del", key, function globalDelCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

/**
 * Notifies all regional caches to purge keys with the specified tag.
 * @param tag the tag to purge
 * @returns A promise that resolves as soon as the purge notification is sent. Since regional caches are
 *  eventually consisten, this may return before every cache is updated.
 */
export async function purgeTag(tag: string): Promise<boolean> {
  return new Promise<boolean>(function globalDelPromise(resolve, reject) {
    bridge.dispatch("flyCacheNotify", "purgeTag", tag, function globalPurgeTagCallback(err: string | null, ok?: boolean) {
      if (err != null) {
        reject(err)
        return
      }
      resolve(ok)
    })
  })
}

export default {
  del,
  purgeTag
}