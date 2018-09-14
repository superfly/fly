/**
 * A library for mounting different `fetch` handlers on 
 * URL pathnames.
 * 
 * @preferred
 * @module fly/fetch/mount
 */

import { FetchFunction, normalizeRequest } from ".";

/**
 * Mount different handlers on URL paths. Example:
 * 
 * ```javascript
 * import { mount } from "@fly/fetch/mount"
 * const mounts = mount({
 *  "/hello/": (req, init) => new Response("hello")
 *  "/": (req, init) => new Response("index")
 * })
 * 
 * fly.http.respondWith(mounts)
 * ```
 */
export function mount(paths: MountInfo): FetchFunction {
  return async function mountFetch(req: RequestInfo, init?: RequestInit) {
    req = normalizeRequest(req)

    const url = new URL(req.url)
    for (const p of Object.getOwnPropertyNames(paths)) {
      if (url.pathname.startsWith(p)) {
        return paths[p](req, init)
      }
    }
    return new Response("no mount found", { status: 404 })
  }
}

/**
 * Path and fetch function map for `mount` handler
 */
export interface MountInfo {
  [prefix: string]: FetchFunction
}

export default mount;