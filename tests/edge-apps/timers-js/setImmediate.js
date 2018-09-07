fly.http.respondWith(async function (request) {
  const start = Date.now()
  await new Promise((resolve, _) => setImmediate(resolve))
  return new Response((Date.now() - start).toString())
})
