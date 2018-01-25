const chain = new MiddlewareChain()
chain.use('fly-backend', { backend: { upstream_scheme: 'http', upstream: '127.0.0.1:3334' } })

addEventListener('fetch', function (event) {
  event.respondWith(chain.run(event.request))
})
