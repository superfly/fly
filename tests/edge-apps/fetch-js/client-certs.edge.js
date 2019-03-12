fly.http.respondWith(async req => {
  const certificate = await req.json()

  try {
    return fetch("https://server.cryptomix.com/secure/", {
      certificate
    })
  } catch (err) {
    return new Response("Fetch error: " + err, { status: 500 })
  }
})
