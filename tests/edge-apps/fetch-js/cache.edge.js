fly.http.respondWith(async req => {
  const url = new URL(req.url)
  const pathAndSearch = `${url.pathname}${url.search}`

  if (req.method === "DELETE") {
    await fetch(`cache://${pathAndSearch}`, { method: "DELETE" })
    return new Response("", { status: 204 })
  }

  const cachedResp = await fetch(`cache://${pathAndSearch}`)
  if (cachedResp.ok) {
    const headers = cachedResp.headers
    headers.set("fly-cache", "hit")
    return new Response(cachedResp.body, { headers })
  }

  const originResp = await fetch(new URL(pathAndSearch, "http://origin.local").href)
  const [respBody, cacheBody] = originResp.body.tee()
  if (originResp.ok) {
    fetch(`cache://${pathAndSearch}`, { body: cacheBody, method: "PUT", headers: originResp.headers })
      .then(ok => console.log(`cached ${pathAndSearch}`))
      .catch(err => console.warn(`failed to cache ${pathAndSearch}: ${e}`))

    const headers = originResp.headers
    headers.set("fly-cache", "miss")
    return new Response(respBody, { headers })
  }

  return new Response("not found", { status: 404 })
})
