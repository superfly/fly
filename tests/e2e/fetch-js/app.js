fly.http.respondWith(async function (req) {
  const url = new URL(req.url)
  const originResponse = await fetch("http://origin.test" + url.pathname)
  const originBody = await originResponse.text()
  return new Response(originBody)
})
