addEventListener('fetch', function (event) {
  event.respondWith(new Response("foo bar"))
})

addEventListener('responseChunk', function (event) {
  event.rewrite(event.chunk.toString().replace('bar', "baz"))
})