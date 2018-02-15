fly.http.respondWith(async function(req){
  const cb = function(){
    console.log("timeout happened")
  }
  setTimeout(cb, 2000)
  return new Response("hello")
})