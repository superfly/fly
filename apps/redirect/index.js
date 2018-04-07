fly.http.respondWith((req) =>
  new Response('Redirecting', {
    headers: { 'Location': 'https://fly.io/docs/apps/' },
    status: 302
  })
)
