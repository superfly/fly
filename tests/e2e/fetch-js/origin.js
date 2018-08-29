fly.http.respondWith(function (req) {
  const url = new URL(req.url)
  return new Response('hello from origin: ' + url.pathname)
})