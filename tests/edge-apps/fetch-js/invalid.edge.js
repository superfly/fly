fly.http.respondWith(request => {
  try {
    return fetch("nope://fly.io")
  } catch (err) {
    return new Response(err.toString(), { status: 500 })
  }
})
