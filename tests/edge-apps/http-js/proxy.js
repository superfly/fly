// proxy for testing edge app fetch with http tests
fly.http.respondWith(async function(request) {
  const url = new URL(request.url)
  url.host = "origin.local"
  request.url = url.toString()
  const resp = await fetch(request)

  if (url.searchParams.has("skip")) {
    resp.headers.set("content-encoding", "skip")
  }
  return resp
})
