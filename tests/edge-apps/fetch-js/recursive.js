fly.http.respondWith(async (request) => {
  const url = new URL(request.url)
  try {
    if (url.pathname == "/wheader") {
      return fetch("http://edge.test/dontrecurse", { headers: { 'fly-allow-recursion': true } })
    } else if (url.pathname == "/dontrecurse") {
      return new Response("", { status: 200 })
    } else {
      return fetch("http://edge.test/")
    }
  } catch (err) {
    return new Response(err.toString(), { status: 500 })
  }
})
