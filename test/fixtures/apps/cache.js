addEventListener('fetch', function (event) {
  event.respondWith(async function () {
    let req = new Request("http://cacheable/foo")
    await cache.add(req) // will fetch
    return await cache.match(req)
  })
})