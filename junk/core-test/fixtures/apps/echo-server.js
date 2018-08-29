fly.http.respondWith(async function (request) {
  console.log("echo server")
  const req = request.clone()
  req.stream = null
  req.bodySource = await req.text()

  return new Response(JSON.stringify(req), {
    headers: {
      'content-type': 'application/json'
    }
  })
})
