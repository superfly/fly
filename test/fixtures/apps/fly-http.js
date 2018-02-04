fly.http.route("/", function(request, route){
  return new Reponse("/")
})

fly.http.respondWith(function(request){
  return new Response("default")
})