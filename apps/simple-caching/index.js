/*
  This is the site we're going to proxy. You can put it in your `.fly.yml` file and/or do `fly secret set HOST https://my-uncached-website.com` in the command line after installing `@fly/fly`.
*/
const destination = new URL(app.config.HOST)

fly.http.respondWith(async (req) => {
  /* Here we take the url from the request and modify it to our actual destination's hostname and protocol. This should preserve the other parts of the url. */
  const url = new URL(req.url)
  url.hostname = destination.hostname
  url.protocol = destination.protocol
  url.port = destination.port
  /* Caches are stored as keys and values, that simple. `fly.cache.get()` and `fly.cache.getString()` accept a key and return whatever is stored. The first time a user accesses this Edge App, our `cached` variable below is going to be null or undefined, cause we've never stored anything yet. */
  let cached = await fly.cache.get(url.href)

  /* No cache? Lets do something about that. */
  if (!cached) {
    /* Fetch the requested site or file. This just happens if nothing is cached. */
    const response = await fetch(url.href)
    /* Get the array buffer value of whatever was returned */
    cached = await response.arrayBuffer()
    /* Now finally we use `url.href` as a key, `cached` as a value, and `60` seconds as a length of time to store the cache for! Anyone viewing the site in the next minute won't hit your main server at all! You may want to cache for much longer. */
    await fly.cache.set(url.href, cached, 60)
  }

  /* Respond with the cached version, whether it was cached just now, or by a previous request. */
  return new Response(cached, {
    status: 200
  })
})
