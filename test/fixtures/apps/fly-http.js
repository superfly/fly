fly.http.route("/", function(request, route){
  return new Response("/")
})

fly.http.respondWith(function(request){
  return new Response("default")
})