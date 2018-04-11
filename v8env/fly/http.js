let router = null
let fetchEventBound = false
let flyFetchHandler = null
let staticDirectory = null

function ensureFetchEvent() {
  if (!fetchEventBound) {
    addEventListener("fetch", handleFetch)
    fetchEventBound = true
  }
}
function handleFetch(event) {
  const req = event.request
  if (staticDirectory) {
    const pathname = new URL(req.url).pathname.substr(1)
    if (pathname.startsWith(staticDirectory)) {
      event.respondWith(staticfor(pathname))
      return
    }
  }

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

async function staticfor(pathname) {
  return await fetch("file://" + pathname)
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
   * Registers an HTTP handler functions. This handler is matched when no routes are set, or no routes match a given request.
   * @public
   * @memberof fly.http
   * @param {httpHandler} fn A function that accepts a request and a set of parameters, and returns a response
   */
  respondWith(fn) {
    ensureFetchEvent()
    flyFetchHandler = fn
  },
  /**
   * Registers an serve functions.
   * @public
   * @memberof fly.static
   * @param {String} dir A function that accepts a directory, and serves all files in that directory staticly
   */
  serveStatic(dir) {
    staticDirectory = dir
  }
}
