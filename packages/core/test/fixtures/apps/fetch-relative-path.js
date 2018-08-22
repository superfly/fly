addEventListener('fetch', function (event) {
  event.respondWith(fetch("/foo"))
})