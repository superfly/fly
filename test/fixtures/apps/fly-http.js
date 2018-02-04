fly.http.route("/", function(request, params){
  return new Response("/")
})
fly.http.respondWith(function(request){
  return new Response("default")
})