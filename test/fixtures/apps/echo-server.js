addEventListener('fetch', function (event) {
  console.log("echo server")
  event.respondWith(new Response(JSON.stringify(event.request), {
    headers: {
      'content-type': 'application/json'
    }
  }))
})
