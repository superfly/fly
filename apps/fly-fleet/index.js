fly.http.respondWith(async (req) => {
  const url = new URL(req.url)
  const res = await fetch("file:/" + url.pathname)
  res.headers.set("content-type", "text/html")
  cache.put(req, res)
  return res
})
