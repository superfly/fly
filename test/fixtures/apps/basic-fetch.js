addEventListener('fetch', async (event) => {
  let res = await fetch("https://example.com")
  event.respondWith(res)
})