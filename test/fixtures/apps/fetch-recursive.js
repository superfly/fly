addEventListener('fetch', function (event) {
  event.respondWith(async function () {
    try {
      return await fetch("http://127.0.0.1:3333/", { headers: { host: "test" } })
    } catch (err) {
      return new Response(err.toString(), { status: 500 })
    }
  })
})