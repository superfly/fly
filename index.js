fly.http.respondWith(req => {
  return fetch("storage://cool-new-things.png")
  // return new Response("HELLO")
})
