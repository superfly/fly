fly.http.respondWith(async function(req) {
  const url = new URL(req.url)
  const originResponse = await fetch("file://" + url.pathname.substring(1))
  if (originResponse.status != 200) {
    return originResponse
  }
  originResponse.headers.set("content-type", contentType(url))
  const originBody = await originResponse.text()
  return new Response(originBody, originResponse)
})

function contentType(url) {
  switch (url.pathname.substring(url.pathname.lastIndexOf(".") + 1)) {
    case "jpg":
      return "image/jpeg"
    case "txt":
      return "text/plain"
  }
  return "application/octet-stream"
}
