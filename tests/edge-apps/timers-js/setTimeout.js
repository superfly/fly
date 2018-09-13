fly.http.respondWith(async function (request) {
  const url = new URL(request.url)
  const timeout = parseInt(url.searchParams.get("t") || "0")

  const start = Date.now()
  await new Promise((resolve, _) => setTimeout(resolve, timeout))
  return new Response((Date.now() - start).toString())
})
