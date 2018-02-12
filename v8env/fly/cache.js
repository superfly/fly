import { logger } from '../logger'
import { transferInto } from '../utils/buffer'

/**
 * @namespace fly.cache
 * @description An API for accessing a regional, volatile cache. Data stored in the `fly.cache` can have an associated per-key time to live (TTL), and we will evict key data automatically after the elapsed TTL. We will also evict unused data periodically.
 */
export default function flyCacheInit(ivm, dispatch) {
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
      if(value instanceof ArrayBuffer){
        logger.debug("Transferring buffer:", key, value.byteLength)
        value = transferInto(ivm, value)
      }
      return new Promise(function (resolve, reject) {
        dispatch.apply(null, [
          "flyCacheSet",
          key,
          value,
          ttl,
          new ivm.Reference(function (err, ok) {
            if (err != null) {
              reject(err)
              return
            }
            resolve(ok)
          })
        ])
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
      return new Promise(function (resolve, reject) {
        dispatch.apply(null, [
          "flyCacheExpire",
          key,
          ttl,
          new ivm.Reference(function (err, value) {
            if (err != null) {
              reject(err)
              return
            }
            resolve(value)
          })
        ])
      })
    }
  }

  function get(key) {
    logger.debug("cache get: " + key)
    return new Promise(function (resolve, reject) {
      dispatch.apply(null, [
        "flyCacheGet",
        key,
        new ivm.Reference(function (err, value) {
          if (err != null) {
            reject(err)
            return
          }
          if(value){
            logger.debug("cache got:", value.constructor.name, value.byteLength)
          }
          resolve(value)
        })
      ])
    })
  }
}