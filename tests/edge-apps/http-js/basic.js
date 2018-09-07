fly.http.respondWith(function (request) {
  const url = new URL(request.url)

  let status = 200
  if (url.pathname.length > 0) {
    status = parseInt(url.pathname.substring(1))
  }

  return new Response("", {
    status: status,
    headers: {
      "x-request-method": request.method
    }
  })
})
