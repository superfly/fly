addEventListener('fetch', async function (event) {
  event.respondWith(await fetch("http://myserver.example:5000/foo1"))
})
