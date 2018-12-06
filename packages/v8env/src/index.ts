/**
 * @module fly
 * @private
 */

// import dispatcherInit from './fly/dispatcher'
import bridgeInit from "./bridge"

import { fireFetchEvent, addEventListener, dispatchEvent, FetchEvent } from "./events"
import { ReadableStream, WritableStream, TransformStream } from "./streams"

import { console } from "./console"
import flyInit from "./fly/index"
import { FetchFunction } from "./fly/fetch"

import { URL, URLSearchParams } from "./url"
import { Headers } from "./headers"

import { TextEncoder, TextDecoder } from "./text-encoding"
import { fetch, TimeoutError } from "./fetch"
import Body from "./body_mixin"
import Blob from "./blob"
import FormData from "./form_data"
import { crypto } from "./crypto"
import { Response } from "./response"
import { Request } from "./request"
import cache from "./cache"
import { setTimeout, setImmediate, clearTimeout, setInterval, clearInterval } from "./timers"

import { Document, Element } from "./document"

import { MiddlewareChain } from "./middleware"

global.middleware = {}

global.bootstrapBridge = function bootstrapBridge(ivm, dispatch) {
  delete global.bootstrapBridge
  bridgeInit(ivm, dispatch)
}

global.bootstrap = function bootstrap() {
  // Cleanup, early!
  delete global.bootstrap

  // Sets up `Error.prepareStacktrace`, for source map support
  require("./error")

  global.fly = flyInit()

  global.console = console

  Object.assign(global, {
    setTimeout,
    clearTimeout,
    setImmediate,
    setInterval,
    clearInterval,
    ReadableStream,
    WritableStream,
    TransformStream,
    TextEncoder,
    TextDecoder,
    Headers,
    Request,
    Response,
    fetch,
    Body,
    Blob,
    FormData,
    URL,
    URLSearchParams,
    cache,
    crypto,
    TimeoutError,
    MiddlewareChain // ugh
  })

  // Events
  global.fireFetchEvent = fireFetchEvent
  global.addEventListener = addEventListener
  global.dispatchEvent = dispatchEvent

  global.FetchEvent = FetchEvent

  // DOM
  global.Document = Document
  global.Element = Element

  global.getHeapStatistics = function getHeapStatistics() {
    return new Promise((resolve, reject) => {
      global.bridge.dispatch("getHeapStatistics", function getHeapStatisticsPromise(err, heap) {
        if (err) {
          reject(err)
          return
        }
        resolve(heap)
      })
    })
  }
}

/* tslint:disable:no-namespace */

declare global {
  /**
   * Fly specific APIs and functionality
   * Modules are available via the `fly` Global variable.
   *
   * The runtime includes an implementation of the [`fetch`](fetch.html) spec
   * for making HTTP requests.
   * @module fly
   * @preferred
   */
  export namespace fly {
    /**
     * The Fly HTTP interface, use this to work with HTTP requests
     */
    export namespace http {
      export function respondWith(response: Promise<Response> | Response | FetchFunction): void
    }
    export namespace log {
      export function log(lvl: string, ...args: any[]): void
      export function addTransport(name: string, options: any): void
      export function addMetadata(metadata: any): void
    }
    export namespace util {
      namespace md5 {
        /**
         * Creates an md5 hash of a string.
         * @param s The string value to hash
         * @returns a string representation of an md5 hash
         */
        export function hash(s: string): string
      }
    }
    export namespace cache {
      /**
       * Get an ArrayBuffer value (or null) from the cache. See `getString` if you
       * want a string value.
       * @param key The key to get
       * @return  Raw bytes stored for provided key or null if empty.
       */
      export function get(key: string): Promise<ArrayBuffer | null>

      /**
       * Get a string value (or null) from the cache
       * @param key The key to get
       * @returns Data stored at the key, or null if none exists
       */
      export function getString(key: string): Promise<string | null>

      /**
       * Sets a value at a certain key, with an optional ttl
       * @param key The key to add or overwrite
       * @param value Data to store at the specified key, up to 2MB
       * @param [ttl] Time to live (in seconds)
       * @returns true if the set was successful
       */
      export function set(key: string, value: string | ArrayBuffer, ttl?: number): Promise<boolean>

      /**
       * Sets or overwrites a key's time to live (in seconds)
       * @param key The key to modify
       * @param ttl Expiration time remaining in seconds
       * @returns true if ttl was set successfully
       */
      export function expire(key: string, ttl: number): Promise<boolean>
    }
  }
}
