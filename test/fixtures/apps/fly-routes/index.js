const chain = new MiddlewareChain()
chain.use('fly-routes')

addEventListener('fetch', function (event) {
  event.respondWith(chain.run(event.request))
})
