import { parse, resolve } from 'url'

/*
  This is the site we're going to proxy. You can put it in your `.fly.yml` file and/or do `fly secret set HOST https://my-uncached-website.com` in the command line after installing `@fly/fly`
*/
const destination = app.config.HOST

fly.http.respondWith(async (req) => {
  /* This just takes apart and reconstructs the url. Not super useful in this example, but I mean to use the params object later to do some other fly.io magic. Also protects against stuff like HOST having or not having a backslash. */
  const params = parse(req.url)
  const path = resolve(destination, params.path)
  /* Caches are stored as keys and values, that simple. You can store `fly.cache.getString()` accepts a key and returns a string version of whatever is stored. The first time a user accesses this Edge App, cached is going to be null or undefined, cause we've never stored anything with any key. */
  let cached = await fly.cache.getString(path)
  /* No cache? Lets do something about that. */
  if (!cached) {
    /* Fetch the requested site. Remember, this just happens if nothing is cached. */
    const request = await fetch(path, {
      headers: {
        Accept: "application/json" // this header makes sure we don't receive .js requests as html, but doesn't seem to bother the html requests
      }
    })
    /* Get the string value of whatever was returned */
    cached = await request.text()
    /* Now finally we use `path` as a key, `cached` as a string value, and `60` seconds as a length of time to store the cache for! Anyone viewing the site in the next minute won't hit your main server at all! You may want to cache for much longer. */
    await fly.cache.set(path, cached, 60)
  }
  /* Respond with the cached version, whether it was cached just now, or by a previous request. */
  return new Response(cached, {
    status: 200
  })
})
