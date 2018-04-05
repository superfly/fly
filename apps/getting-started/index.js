<<<<<<< HEAD
let array = new Uint8Array(1)
array[0] = 10

fly.http.respondWith(function(request){
  return new Response(array, { status: 200})
=======
addEventListener('fetch', function (event) {
  event.respondWith(new Response('Redirecting',
    {
      headers: {
        'Location': 'https://fly.io/docs/apps/'
      },
      status: 302
    }
  ))
>>>>>>> d8e1cda211243a5d479d8941914ea2ff97367e14
})
