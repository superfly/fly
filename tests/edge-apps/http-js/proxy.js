// proxy for testing edge app fetch with http tests
fly.http.respondWith(async function(request) {
  console.log("PROXY REQUEST")
  const url = new URL(request.url)
  url.host = "origin.test"
  request.url = url.toString()
  const res = await fetch(request)
  console.log("PROXY RESPONSE", { res, body: await res.text() })
  return res
})
