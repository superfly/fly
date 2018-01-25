addEventListener('fetch', function (event) {
  event.respondWith(async function () {
    let req = new Request("http://cacheable/foo")
    await cache.add(req)
    return await cache.match(req)
  })
})