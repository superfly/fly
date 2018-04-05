let array = new Uint8Array(1)
array[0] = 10

fly.http.respondWith(function(request){
  return new Response(array, { status: 200})
})
