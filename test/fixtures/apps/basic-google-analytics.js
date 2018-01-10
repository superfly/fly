const chain = new MiddlewareChain()
chain.use('google-analytics', { tracking_id: 'poutine-is-good' })


addEventListener('fetch', async function (event) {
  event.respondWith(await chain.run(event.request))
})