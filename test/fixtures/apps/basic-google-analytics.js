const chain = new MiddlewareChain()
chain.use('google-analytics', { tracking_id: 'poutine-is-good' })


addEventListener('fetch', function (event) {
  event.respondWith(chain.run(event.request))
})