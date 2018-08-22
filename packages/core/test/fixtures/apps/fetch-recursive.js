addEventListener('fetch', function (event) {
  event.respondWith(function () {
    const url = new URL(event.request.url)
    try {
      if (url.pathname == "/wheader") {
        return fetch("http://127.0.0.1:3333/dontrecurse", { headers: { host: "test", 'fly-allow-recursion': true } })
      } else if (url.pathname == "/dontrecurse") {
        return new Response("", { status: 200 })
      } else {
        return fetch("http://127.0.0.1:3333/", { headers: { host: "test" } })
      }
    } catch (err) {
      return new Response(err.toString(), { status: 500 })
    }
  })
})