const chain = new MiddlewareChain()
chain.use('fly-routes')

addEventListener('fetch', async function (event) {
  event.respondWith(await chain.run(event.request))
})
