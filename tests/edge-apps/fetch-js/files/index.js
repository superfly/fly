fly.http.respondWith(async function (req) {
  const url = new URL(req.url)
  const originResponse = await fetch("file://" + url.pathname.substring(1))
  if (originResponse.status != 200) {
    return originResponse
  }
  const originBody = await originResponse.text()
  return new Response(originBody, originResponse)
})
