fly.http.respondWith(function(request) {
  const url = new URL(request.url)

  headers = {
    "Content-Type": "application/json"
  }

  for (const [key, value] of url.searchParams) {
    headers[key] = value
  }

  return new Response(JSON.stringify(request.headers), { headers })
})
