addEventListener('fetch', async function (event) {
  let req = new Request("http://cacheable/foo")
  await cache.add(req)

  let cachedRes = await cache.match(req)

  event.respondWith(cachedRes)
})