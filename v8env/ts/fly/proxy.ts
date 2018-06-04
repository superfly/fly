/**
 * Library for proxying requests to origins. Use this to create `fetch` like functions
 *  for making requests to other services. For example:
 * 
 * ```javascript
 * // sends all traffic to an Amazon ELB,
 * // `Host` header passes through from visitor request
 * const origin = proxy("https://elb1298.amazonaws.com")
 * ```
 * 
 * By default, this function sends the `Host` header inferred from the origin URL. To forward
 * host headers sent by visitors, set `forwardHostHeader` to true.
 * 
 * ```javascript
 * // sends all traffic to an Amazon ELB, include host header from original request.
 * const origin = proxy("https://elb1298.amazonaws.com", {
 *  forwardHostHeader: true
 * })
 * ```
 * 
 * And then way more rare, no host header at all. Usually you'd strip out `x-forwarded-host`, 
 * since some origins don't like that:
 * ```javascript
 * // sends all traffic to an Amazon ELB, never sends a host header
 * const origin = proxy("https://elb1298.amazonaws.com", {
 *  headers: { host: false}
 * })
 * ```
 * 
 * @preferred
 * @module fly/proxy
 */

/**
 * This generates a `fetch` like function for proxying requests to a given origin.
 * When this function makes origin requests, it adds standard proxy headers like 
 * `X-Forwarded-Host` and `X-Forwarded-For`. It also passes headers from the original
 * request to the origin.
 * @param origin A URL to an origin, can include a path to rebase requests.
 * @param options Options and headers to control origin request.
 */
export default function proxy(origin: string | URL, options?: ProxyOptions) {
  return function proxyFetch(req: RequestInfo, init?: RequestInit) {
    if (!options) {
      options = {}
    }
    const breq = buildProxyRequest(origin, options, req, init)
    return fetch(breq)
  }
}

interface FlyRequest extends Request {
  url: string
}

/**
 * @protected
 * @hidden
 * @param origin 
 * @param options 
 * @param req 
 * @param init 
 */
export function buildProxyRequest(origin: string | URL, options: ProxyOptions, req: RequestInfo, init?: RequestInit) {

  if (typeof req === "string") {
    req = new Request(req)
  }
  const url = new URL(req.url)
  let breq: FlyRequest | null = null

  if (req instanceof Request) {
    breq = req.clone()
  } else {
    breq = new Request(req)
  }

  if (typeof origin === "string") {
    origin = new URL(origin)
  }

  url.hostname = origin.hostname
  url.protocol = origin.protocol
  url.port = origin.port

  if (options.stripPath && typeof options.stripPath === 'string') {
    // remove basePath so we can serve `onehosthame.com/dir/` from `origin.com/`
    url.pathname = url.pathname.substring(options.stripPath.length)
  }
  if (origin.pathname && origin.pathname.length > 0) {
    url.pathname = [origin.pathname.replace(/\/$/, ''), url.pathname.replace(/^\//, "")].join("/")
  }
  if (url.pathname.startsWith("//")) {
    url.pathname = url.pathname.substring(1)
  }

  breq.url = url.toString()
  // we extend req with remoteAddr
  breq.headers.set("x-forwarded-for", (<any>req).remoteAddr)
  breq.headers.set("x-forwarded-host", url.hostname)

  if (!options.forwardHostHeader) {
    // set host header to origin.hostnames
    breq.headers.set("host", origin.hostname)
  }

  if (options.headers) {
    for (const h of Object.getOwnPropertyNames(options.headers)) {
      const v = options.headers[h]
      if (v === false) {
        breq.headers.delete(h)
      } else if (v && typeof v === "string") {
        breq.headers.set(h, v)
      }
    }
  }
  return <Request>breq
}

/**
 * Options for `proxy`.
 */
export interface ProxyOptions {
  /**
   * Replace this portion of URL path before making request to origin.
   * 
   * For example, this makes a request to `https://fly.io/path1/to/document.html`:
   * ```javascript
   * const opts = { stripPath: "/path2/"}
   * const origin = proxy("https://fly.io/path1/", opts)
   * origin("https://somehostname.com/path2/to/document.html")
   * ```
   */
  stripPath?: string,

  /**
   * Forward `Host` header from original request. Without this options,
   * proxy requests infers a host header from the origin URL.
   * Defaults to `false`.
   */
  forwardHostHeader?: boolean,

  /**
   * Headers to set on backend request. Each header accepts either a `boolean` or `string`.
   * * If set to `false`, strip header entirely before sending.
   * * `true` or `undefined` send the header through unmodified from the original request.
   * * `string` header values are sent as is
   */
  headers?: {
    [key: string]: string | boolean | undefined,
    /**
     * Host header to set before sending origin request. Some sites only respond to specific
     * host headers.
     */
    host?: string | boolean
  }
}