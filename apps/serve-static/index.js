fly.http.serveStatic('public')

fly.http.respondWith(async (req) => new Response('hello'))
