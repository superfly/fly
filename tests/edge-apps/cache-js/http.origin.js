fly.http.respondWith((request) => {
  const url = new URL(request.url)

  const headers = {
    date: 'Wed, 13 Dec 2017 21:32:50 GMT',
    'content-type': 'text/plain; charset=utf-8',
  }

  if (url.pathname.startsWith("/public")) {
    headers["cache-control"] = "public, max-age=7234"
  }

  return new Response("hello from origin", { headers })
})
