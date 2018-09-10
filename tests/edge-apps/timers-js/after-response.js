fly.http.respondWith(async function (req) {
  setTimeout(() => {
    fly.cache.set("callback-ran", "yes")
  }, 20)

  const callbackRan = await fly.cache.get("callback-ran") || "no"

  return new Response(callbackRan)
})