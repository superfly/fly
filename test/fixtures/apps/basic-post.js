addEventListener('fetch', async (event) => {
  let res = await fetch("https://example.com", {
    method: "POST",
    body: "testing",
  })

  event.respondWith(res)
})