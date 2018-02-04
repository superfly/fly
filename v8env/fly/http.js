const logger = require("../logger")

let router = undefined
let fetchEventBound = false
let flyFetchHandler = undefined

function ensureFetchEvent(){
  if(!fetchEventBound){
    addEventListener("fetch", handleFetch)
    fetchEventBound = true
  }
}
function ensureRouter(){
  if(!router){
    router = require('routes')
  }
  return router
}
function handleFetch(event){
  let match = undefined
  if(router){
    match = router.match(event.request.path)

    if(match){
      event.respondWith(match.fn(event.request, match))
      return
    }
  }

  if(flyFetchHandler){
    event.respondWith(flyFetchHandler(request))
    return
  }

  event.respondWith("404", { status: 404 })
}
module.exports = {
  route(pattern, fn){
    ensureRouter().addRoute(pattern, fn)
  },
  respondWith(fn){
    flyFetchHandler = fn
  }
}