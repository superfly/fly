addEventListener('fetch', function (event) {
  event.respondWith(fetch("http://test/set-cookies"))
})