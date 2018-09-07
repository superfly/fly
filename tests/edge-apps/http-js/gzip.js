fly.http.respondWith(function (request) {
  const url = new URL(request.url)

  const contentType = url.pathname.substring(1)

  const headers = {
    "content-type": contentType
  }

  if (url.searchParams.has("gz")) {
    headers["content-encoding"] = ["gzip"]
  }

  return new Response(contentType, { headers })
})
