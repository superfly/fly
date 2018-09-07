fly.http.respondWith(async (request) => {

  const url = new URL(request.url)

  if (url.pathname.startsWith("/get/")) {
    const key = url.pathname.slice(5)
    const value = await fly.cache.get(key)
    if (!value) {
      return new Response("not found", { status: 404 })
    }
    return new Response(value)
  } else if (url.pathname.startsWith("/getString/")) {
    const key = url.pathname.slice(11)
    const value = await fly.cache.getString(key)
    if (!value) {
      return new Response("not found", { status: 404 })
    }
    return new Response(value)
  } else if (url.pathname.startsWith("/set/")) {
    const key = url.pathname.slice(5)
    const value = await request.text()
    const ttl = parseInt(url.searchParams.get("ttl"))
    const result = await fly.cache.set(key, value, ttl)
    if (!result) {
      return new Response("not set", { status: 400 })
    }
    return new Response("set", { status: 201 })
  } else if (url.pathname.startsWith("/del/")) {
    const key = url.pathname.slice(5)
    const result = await fly.cache.del(key)
    if (!result) {
      return new Response("not deleted", { status: 400 })
    }
    return new Response("deleted", { status: 202 })
  }
})