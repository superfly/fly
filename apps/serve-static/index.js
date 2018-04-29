fly.http.respondWith(async (req) => {
  if (new URL(req.url).pathname.includes('public')) return fly.http.serveStatic(req)
  return new Response('hello')
})
