import { logger } from '../logger'
import { transferInto } from '../utils/buffer'

/**
 * @namespace fly.cache
 * @description An API for accessing a regional, volatile cache. Data stored in the `fly.cache` can have an associated per-key time to live (TTL), and we will evict key data automatically after the elapsed TTL. We will also evict unused data periodically.
 */
export default function flyCacheInit(ivm, dispatcher) {
  return {
    /**
     * Get a string value (or null) from the cache
     * @public
     * @function
     * @memberof fly.cache
     * @param {String} key The key to get
     * @returns {Promise<String|Null>} Data stored at the key, or null if none exists
     */
    async getString(key) {
      const buf = await get(key)
      if (!buf)
        return buf
      return new TextDecoder('utf-8').decode(buf)
    },

    /**
     * Get an ArrayBuffer value (or null) from the cache
     * @public
     * @function
     * @memberof fly.cache
     * @param {String} key The key to get
     * @return {Promise<ArrayBuffer|Null>} Raw bytes stored for provided key or null if empty.
     */
    get: get,

    /**
     * Sets a value at a certain key, with an optional ttl
     * @memberof fly.cache
     * @param {String} key The key to add or overwrite
     * @param {String} value Data to store at the specified key, up to 2MB
     * @param {Integer} [ttl] Time to live (in seconds)
     * @returns {Promise<Boolean>} true if the set was successful
     */
    set(key, value, ttl) {
      logger.debug("cache set")
      let size = value.length
      if (size > 2 * 1024 * 1024) {
        return Promise.reject("Cache does not support values > 2MB")
      }
      if (value instanceof ArrayBuffer) {
        logger.debug("Transferring buffer:", key, value.byteLength)
        value = transferInto(ivm, value)
      }

      return new Promise(function cacheSetPromise(resolve, reject) {
        const cb = new ivm.Reference(function cacheSetCallback(err, ok) {
          cb.release()
          if (err != null) {
            reject(err)
            return
          }
          resolve(ok)
        })
        dispatcher.dispatch("flyCacheSet", key, value, ttl, cb).catch((err) => {
          try { cb.release() } catch (e) { }
          reject(err)
        })
      })
    },
    /**
     * Add or overwrite a key's  time to live
     * @function
     * @memberof fly.cache
     * @param {String} key The key to modify
     * @param {Integer} ttl Expiration time remaining in seconds
     * @returns {Promise<Boolean>} true if ttl was successfully updated
     */
    expire(key, ttl) {
      logger.debug("cache expire:", ttl)
      return new Promise(function cacheExpirePromise(resolve, reject) {
        const cb = new ivm.Reference(function cacheExpireCallback(err, value) {
          cb.release()
          if (err != null) {
            reject(err)
            return
          }
          resolve(value)
        })
        dispatcher.dispatch("flyCacheExpire", key, ttl, cb).catch((err) => {
          try { cb.release() } catch (e) { }
          reject(err)
        })
      })
    }
  }

  function get(key) {
    logger.debug("cache get: " + key)

    return new Promise(function cacheGetPromise(resolve, reject) {
      const cb = new ivm.Reference(function cacheGetCallback(err, value) {
        cb.release()
        if (err != null) {
          reject(err)
          return
        }
        resolve(value)
      })
      dispatcher.dispatch("flyCacheGet", key, cb).catch((err) => {
        try { cb.release() } catch (e) { }
        reject(err)
      })
    })
  }
}