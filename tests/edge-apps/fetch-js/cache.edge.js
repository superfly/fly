fly.http.respondWith(async req => {
  const url = new URL(req.url)
  const pathAndSearch = `${url.pathname}${url.search}`
  const key = pathAndSearch

  const cachedResp = await fetch(`cache://${key}`)
  if (cachedResp.ok) {
    const headers = cachedResp.headers
    headers.set("fly-cache", "hit")
    return new Response(cachedResp.body, { headers })
  }

  const originResp = await fetch(new URL(pathAndSearch, "http://origin.local").href)
  const [respBody, cacheBody] = originResp.body.tee()
  if (originResp.ok) {
    fetch(`cache://${key}`, { body: cacheBody, method: "PUT", headers: originResp.headers })
      .then(ok => console.log(`cached ${key}`))
      .catch(err => console.warn(`failed to cache ${key}: ${e}`))

    const headers = originResp.headers
    headers.set("fly-cache", "miss")
    return new Response(respBody, { headers })
  }

  return new Response("not found", { status: 404 })
})
