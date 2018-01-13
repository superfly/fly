addEventListener('fetch', async function (event) {
  console.log("cache-api mw:", event.request.url)
  let body = await fly.cache.getString(event.request.url)
  let ttl = parseInt(event.request.headers.get('ttl'))
  if (!isNaN(ttl)) {
    ttl = ttl / 2 // we're going to run the expire command too
  }
  if (body == null) {
    body = event.request.url
    if (event.request.url.match(/\/cache-api\/yuge\//)) {
      console.log("Setting a yuge cache value")
      try {
        await fly.cache.set(event.request.url, "☃".repeat(2.1 * 1024 * 1024), ttl)
      } catch (err) {
        console.log(err.toString(), "body:", body)
        event.respondWith(new Response(err.toString(), { status: 500 }))
        return
      }
    } else {
      await fly.cache.set(event.request.url, body, ttl)
    }
    if (!isNaN(ttl)) {
      await fly.cache.expire(event.request.url, ttl * 2) // sets it back to the original value
    }
  }

  let res = new Response(body, {})

  event.respondWith(res)
})