const chain = new MiddlewareChain()
chain.use('force-ssl')
chain.use('fly-echo')

addEventListener("fetch", (event)=>{
  event.respondWith(chain.run(event.request))
})