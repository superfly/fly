addEventListener('fetch', function (event) {
  event.respondWith(new Response(null,
    {
      headers: {
        'Location': 'https://fly.io/docs/apps/'
      },
      status: 302
    }
  ))
})