/**
 * Fly API for working with HTTP requests.
 * @module fly
 * @private
 */

declare var fly;
let fetchEventBound = false
let flyFetchHandler = null

function ensureFetchEvent() {
  if (!fetchEventBound) {
    addEventListener("fetch", handleFetch)
    fetchEventBound = true
  }
}
function handleFetch(event) {
  const req = event.request
  if (flyFetchHandler != null) {
    const resp = flyFetchHandler(req)
    if (
      !(resp instanceof Promise) &&
      !(resp instanceof Response)
    ) {
      throw new Error('fly.http.respondWith function returned the wrong type, expected Promise<Response> or Response')
    }
    event.respondWith(resp)
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