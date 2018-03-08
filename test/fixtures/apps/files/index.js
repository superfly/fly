addEventListener('fetch', function (event) {
  event.respondWith(fetch("file://dummy.txt"))
})