addEventListener('fetch', function (event) {
  event.respondWith(async function () {
    const res = await fetch("https://example.com", { readTimeout: 10 })
    return new Promise(function (resolve, rej) {
      setTimeout(async function () {
        try {
          await res.text()
          resolve(new Response("nope", { status: 500 }))
        } catch (e) {
          resolve(new Response("got an error"))
        }
      }, 20)
    })
  })
})