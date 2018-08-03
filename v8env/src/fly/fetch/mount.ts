/**
 * A library for mounting different `fetch` handlers on 
 * URL pathnames.
 * 
 * @preferred
 * @module fly/fetch/mount
 */

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
export function mount(paths: MountInfo) {
  return async function mountFetch(req: RequestInfo, init?: RequestInit) {
    if (typeof req === "string") {
      req = new Request(req, init)
    }
    if (!(req instanceof Request)) {
      throw new Error("req must be either a string or a Request object")
    }
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
  [prefix: string]: (req: RequestInfo, init?: RequestInit) => Promise<Response>
}

export default mount;