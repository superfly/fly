addEventListener('fetch', function (event) {
  event.respondWith(fetch("http://myserver.example:5000/foo1"))
})
