fly.http.respondWith(async (request) => {
  const url = new URL(request.url)
  let req = new Request("http://origin.test" + url.pathname)
  let req2 = req.clone()
  await cache.add(req) // will fetch
  const matchResult = await cache.match(req2)
  if (matchResult) {
    return matchResult
  }
  return new Response("no match found", { status: 404 })
})