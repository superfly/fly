fly.http.respondWith(async req => {
  const url = new URL(req.url)
  const pathAndSearch = `${url.pathname}${url.search}`
  const key = pathAndSearch

  const cachedResp = await fetch(`storage://${key}`)
  console.log("cache response", { cachedResp })
  if (cachedResp.ok) {
    console.log("cache hit!")
    return new Response(cachedResp.body)
  }

  const originResp = await fetch(`https://picsum.photos${pathAndSearch}`)
  const [respBody, cacheBody] = originResp.body.tee()
  if (originResp.ok) {
    fetch(`storage://${key}`, { body: cacheBody, method: "PUT" })
      .then(ok => console.log(`cached ${key}`))
      .catch(err => console.warn(`failed to cache ${key}: ${e}`))

    return new Response(respBody)
  }

  return new Response("not found", { status: 404 })
})
