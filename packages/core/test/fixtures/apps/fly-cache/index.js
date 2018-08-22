fly.http.respondWith(async function (request) {
  let body = await fly.cache.getString(request.url)
  let ttl = parseInt(request.headers.get('ttl'))
  if (!isNaN(ttl)) {
    ttl = ttl / 2 // we're going to run the expire command too
  }
  if (body == null) {
    body = request.url
    if (request.url.match(/\/cache-api\/yuge\//)) {
      console.log("Setting a yuge cache value")
      try {
        await fly.cache.set(request.url, "☃".repeat(2.1 * 1024 * 1024), ttl)
      } catch (err) {
        console.log(err.toString(), "body:", body)
        return new Response(err.toString(), { status: 500 })
      }
    } else {
      const result = await fly.cache.set(request.url, body, ttl)
      if (!result) {
        throw new Error("Cache set returned false")
      }
    }
    if (!isNaN(ttl)) {
      await fly.cache.expire(request.url, ttl * 2) // sets it back to the original value
    }
  }

  return new Response(body, {})
})