fly.http.respondWith(async function(req){
  const cb = function(){
    console.log("timeout happened")
    fly.cache.set("long-wait-after-response", req.headers.get("X-Cache-Value"))
  }
  setTimeout(cb, 500)
  return new Response("hello")
})