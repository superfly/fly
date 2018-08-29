fly.http.respondWith(function () {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve(new Response("hello"))
    }, 100)
  })
})