/**
 * @module fly/cache
 * @public
 */
module.exports = function (ivm, dispatch) {
  return {
    /**
     * Get a string value (or Null) from the cache
     * @function module:fly/cache.getString
     * @param {String} key The key to get
     * @returns {Promise<String|Null>} Data stored at the key, or Null if none exists
     */
    getString(key) {
      console.log("cache get: " + key)
      return new Promise(function (resolve, reject) {
        dispatch.apply(null, [
          "flyCacheGetString",
          key,
          new ivm.Reference(function (err, value) {
            if (err != null) {
              reject(err)
              return
            }
            resolve(value)
          })
        ])
      })
    },
    /**
     * Add or overwrite a key's  time to live
     * @param {String} key The key to modify
     * @param {Integer} ttl Expiration time remaining in seconds
     * @returns {Promise<Boolean>} true if ttl was successfully updated
     */
    expire(key, ttl) {
      console.log("cache expire:", ttl)
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
    },
    /**
     * Sets a value at a certain key, with an optional ttl
     * @param {String} key The key to add or overwrite
     * @param {String} value Data to store at the specified key, up to 2MB
     * @param {Integer} [ttl] Time to live (in seconds)
     * @returns {Promise<Boolean>} true if the set was successful
     */
    set(key, value, ttl) {
      console.log("cache set")
      let size = value.length
      if (size > 2 * 1024 * 1024) {
        return Promise.reject("Cache does not support values > 2MB")
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
    }
  }
}