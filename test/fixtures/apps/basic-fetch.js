addEventListener('fetch', (event) => {
  event.respondWith(fetch("https://example.com"))
})