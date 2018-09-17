/**
 * @module fly
 * @private
 */
import { logger } from "./logger"

/**
 * @class
 * @param {Object} [init]
 */
export default function Headers(init) {
  Object.defineProperty(this, "_headerList", {
    enumerable: false,
    value: []
  })
  if (init) {
    fill(this, init)
  }
}

// interface Headers
Headers.prototype = {
  // void append(ByteString name, ByteString value);
  /**
   * Adds a header. Does not overwrite existing headers with same name
   * @param {String} name
   * @param {String} value
   */
  append: function append(name, value) {
    name = name.toLowerCase()
    this._headerList.push([name, value])
  },

  /** Deletes header(s) by name
   * @param {String} name */
  delete: function delete_(name) {
    name = name.toLowerCase()
    let index = 0
    while (index < this._headerList.length) {
      if (this._headerList[index][0] === name) {
        this._headerList.splice(index, 1)
      } else {
        ++index
      }
    }
  },

  /**
   * Gets first header by name
   * @param {String} name
   * @returns {String?}
   */
  get: function get(name) {
    name = name.toLowerCase()
    const raw = []
    for (let index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name) {
        raw.push(this._headerList[index][1])
      }
    }
    if (raw.length > 0) {
      return raw.join(", ")
    }
    return null
  },

  /**
   * Gets all headers by name
   * @param {String} name
   * @returns {sequence<String>}
   */
  getAll: function getAll(name) {
    name = name.toLowerCase()
    const sequence = []
    for (let index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name) {
        sequence.push(this._headerList[index][1])
      }
    }
    return sequence
  },

  /**
   * Checks for existence of header by name
   * @param {String} name
   * @returns {boolean}
   */
  has: function has(name) {
    name = name.toLowerCase()
    for (let index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name) {
        return true
      }
    }
    return false
  },

  /**
   * Sets a header by name. Overwrites existing headers with same name
   * @param {String} name
   * @param {String} value
   */
  set: function set(name, value) {
    name = name.toLowerCase()
    for (let index = 0; index < this._headerList.length; ++index) {
      if (this._headerList[index][0] === name) {
        this._headerList[index++][1] = value
        while (index < this._headerList.length) {
          if (this._headerList[index][0] === name) {
            this._headerList.splice(index, 1)
          } else {
            ++index
          }
        }
        return
      }
    }
    this._headerList.push([name, value])
  },

  /**
   * @returns {Object<string,string[]>}
   */
  toJSON: function toJSON() {
    const jsonHeaders = {}
    for (const h of this._headerList) {
      if (h[0] === "host") {
        jsonHeaders[h[0]] = this.get(h[0])
        continue
      }

      logger.debug("setting", h[0], this.getAll(h[0]))
      jsonHeaders[h[0]] = this.getAll(h[0])
    }
    return jsonHeaders
  }
}
Headers.prototype[Symbol.iterator] = function() {
  return new HeadersIterator(this)
}

function HeadersIterator(headers) {
  this._headers = headers
  this._index = 0
}
HeadersIterator.prototype = {}
HeadersIterator.prototype.next = function() {
  if (this._index >= this._headers._headerList.length) {
    return { value: undefined, done: true }
  }
  return { value: this._headers._headerList[this._index++], done: false }
}
HeadersIterator.prototype[Symbol.iterator] = function() {
  return this
}

function fill(headers, init) {
  if (init instanceof Headers) {
    init._headerList.forEach(header => {
      headers.append(header[0], header[1])
    })
  } else if (Array.isArray(init)) {
    init.forEach(header => {
      if (!Array.isArray(header) || header.length !== 2) {
        throw TypeError()
      }
      headers.append(header[0], header[1])
    })
  } else {
    init = Object(init)
    for (const name of Object.keys(init)) {
      if (Array.isArray(init[name])) {
        init[name].forEach(v => {
          headers.append(name, v)
        })
      } else {
        headers.set(name, init[name])
      }
    }
  }
}
