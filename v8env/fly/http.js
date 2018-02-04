const routes = require('routes')
let router = null
let fetchEventBound = false
let flyFetchHandler = null

function ensureFetchEvent(){
  if(!fetchEventBound){
    global.addEventListener("fetch", handleFetch)
    fetchEventBound = true
  }
}
function ensureRouter(){
  console.log("ensuring router")
  if(!router){
    router = routes()
    ensureFetchEvent()
  }
  return router
}
function handleFetch(event){
  if(router){
    const path = new URL(event.request.url).pathname
    let match = router.match(path)
    console.log("match:", match)

    if(match){
      event.respondWith(match.fn(event.request, match))
      return
    }
  }

  if(flyFetchHandler != null){
    event.respondWith(flyFetchHandler(event.request))
    return
  }

  event.respondWith(new Response("404", { status: 404 }))
}
module.exports = {
  route(pattern, fn){
    console.log("registering route:", pattern)
    ensureRouter().addRoute(pattern, fn)
  },
  respondWith(fn){
    ensureFetchEvent()
    console.log("setting respondWith")
    flyFetchHandler = fn
  }
}