fly.http.respondWith(function (request) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      resolve(new Response("wrong callback"))
    }, 30)
    clearTimeout(t)
    setTimeout(() => {
      resolve(new Response("right callback"))
    }, 50)
  })
})
