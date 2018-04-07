fly.http.respondWith((req) => {
  const res = new Response("Hello World", { status: 200})
  cache.put(req, res) // This request becomes cached
  return res
})
