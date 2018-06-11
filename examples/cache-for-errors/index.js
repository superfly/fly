// this imports a utility class for caching HTTP responses
import responseCache from './lib/response-cache'

// Handle HTTP requests
fly.http.respondWith(async function (req) {
  const cacheKey = req.url.replace(/\?status=\d+$/, '')

  // Fetch from
  let resp = await origin(req)

  if (resp.status < 400 || resp.status > 599) {
    // response is good, cache it forever
    await responseCache.set(cacheKey, resp)
    // and return it
    return resp
  }

  let cachedResponse = await responseCache.get(cacheKey)

  if (cachedResponse) {
    // set origin status in headers and return cached response
    cachedResponse.headers.set("Origin-Status", resp.status.toString())
    return cachedResponse
  }

  // if we got here, it's an error and we have nothing cached :()
  return resp
})

/**
 * This is just a basic origin http server that 
 * lets us control status codes.
 * 
 *   `/` => successful response
 *   `/?status=404` => serves a 404
 *   `/?status=500` => serves a 500
 */
async function origin(req, init) {
  const url = new URL(req.url)
  const status = parseInt(url.searchParams.get('status') || '200')

  if (status === 200) {
    return new Response(`hello from ${req.url} on ${new Date()}`)
  } else {
    return new Response(`an error! Number ${status}`, { status: status })
  }
}