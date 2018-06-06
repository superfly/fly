addEventListener('fetch', function (event) {
  event.respondWith(new Response('Redirecting',
    {
      headers: {
        'Location': 'https://fly.io/docs/apps/'
      },
      status: 302
    }
  ))
})
