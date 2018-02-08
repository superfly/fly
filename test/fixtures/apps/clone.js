addEventListener('fetch', function (event) {
  event.respondWith(async function () {
    const req1 = event.request
    const req2 = req1.clone()

    const res1 = new Response(`${await req2.text()}${await req1.text()}`)
    const res2 = res1.clone()

    return new Response(`res1: ${await res1.text()}\nres2: ${await res2.text()}`)
  })
})