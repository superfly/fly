fly.http.respondWith(async function (req) {
  console.log('looking for: ', new URL(req.url).pathname)
  return fly.http.serveStatic(req)
})
