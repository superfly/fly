/**
 * Fly specific APIs and functionality
 * Modules are available via the `fly` Global variable.
 * 
 * The runtime includes an implementation of the [`fetch`](fetch.html) spec
 * for making HTTP requests.
 * @module fly
 * @preferred
 */
export declare module fly {
  /**
   * The Fly HTTP interface, use this to work with HTTP requests
   */
  export namespace http {
    export function respondWith(response: Promise<Response> | Response | ((req: Request) => Promise<Response>)): void
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
  //export const streams: any
  /**
   * An image manipulation library. Useful for resizing and optimizing images.
   */
  //export const Image: img.Image
}
