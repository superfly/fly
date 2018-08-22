addEventListener('fetch', function (event) {
  event.respondWith(async function () {
    let req = new Request("http://cacheable/foo")
    let req2 = req.clone()
    await cache.add(req) // will fetch
    return await cache.match(req2)
  })
})