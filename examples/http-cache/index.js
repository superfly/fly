// Handle HTTP requests
fly.http.respondWith(async function (req) {
  // Match the requests against the built
  // in HTTP cache
  let resp = await cache.match(req)

  if (resp) {
    // got a HIT!
    resp.headers.set("Cache", "HIT")
    return resp
  }

  // Cache miss, fetch from origin
  resp = await origin(req)

  // Put the response in the cache
  await cache.put(req, resp)

  // set a header so we can tell
  resp.headers.set("Cache", "MISS")

  // return fresh response
  return resp
})

/**
 * This is just a basic origin http server that 
 * response to two paths:
 * 
 *   `/` => "hello", cached for 10 min
 *   `/never-cache` => "hello", never cached
 */
async function origin(req, init) {
  const url = new URL(req.url)

  switch (url.pathname) {
    case "/":
      return new Response(`hello at ${new Date()}`, {
        headers: {
          "Cache-Control": "max-age=600"
        }
      })
    case "/never-cache":
      return new Response(`hello at ${new Date()}`)
  }
  return new Response("not found", { status: 404 })
}