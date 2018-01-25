addEventListener('fetch', function (event) {
  event.respondWith(fetch("http://setcookies"))
})