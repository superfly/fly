addEventListener('fetch', (event) => {
  // not really gzippped, but doesn't matter
  event.respondWith(new Response("gzipped", { headers: { "content-encoding": "gzip" } }))
})