let router = null
let fetchEventBound = false
let flyFetchHandler = null

function ensureFetchEvent() {
  if (!fetchEventBound) {
    global.addEventListener("fetch", handleFetch)
    fetchEventBound = true
  }
}
function ensureRouter() {
  if (!router) {
    router = require('find-my-way')()
    ensureFetchEvent()
  }
  return router
}
function handleFetch(event) {
  const req = event.request
  if (router) {
    const path = new URL(req.url).pathname
    let match = router.find(req.method, path)

    if (match) {
      event.respondWith(match.handler(req, match))
      return
    }
  }

  if (flyFetchHandler != null) {
    event.respondWith(flyFetchHandler(req))
    return
  }

  event.respondWith(new Response("404", { status: 404 }))
}

/**
 * @namespace fly.http
 * @description An API for routing and responding to HTTP/HTTPs requests.
 */
/**
 * An http/https handler function for processing a request and returning a response
 * @callback httpHandler
 * @function httpHandler
 * @param {Request} request The HTTP request to operate on
 * @param {Object} [params] The parameters (if any) extracted from the route pattern
 * @returns {Response} An HTTP response generated for the request
 */
module.exports = {
  /**
   * Register a handler to use for specific route patterns
   * @public
   * @memberof fly.http
   * @param {String|Array<string>} [method=["GET,"HEAD"]] The http method (or methods, if it's an array) to match
   * @param {String} pattern The path to match. This accepts <code>/static/paths</code>, <code>/:parametric/path</code>, or <code>/path/*wildcards</code>. Parameters in patsh can include regular expressions like <code>/:param(^[regex])</code> 
   * @param {httpHandler} fn A function that accepts a request and a set of parameters, and returns a response
   */
  route() {
    const r = ensureRouter()
    let method = "GET"
    if (arguments.length == 2) {
      method = ["GET", "HEAD"]
    } else if (arguments.length == 3) {
      method = arguments[0]
    } else {
      throw "fly.route requires either 2 or three arguments: (method?, pattern, fn)"
    }
    const pattern = arguments[arguments.length - 2]
    const fn = arguments[arguments.length - 1]
    try {
      r.on(method, pattern, fn)
    } catch (err) {
      throw err
    }
    //ensureRouter().addRoute(pattern, fn)
  },

  /**
   * Registers an HTTP handler functions. This handler is matched when no routes are set, or no routes match a given request.
   * @public
   * @memberof fly.http 
   * @param {httpHandler} fn A function that accepts a request and a set of parameters, and returns a response
   */
  respondWith(fn) {
    ensureFetchEvent()
    flyFetchHandler = fn
  }
}