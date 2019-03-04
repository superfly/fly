import { responseCache } from "@fly/cache"

fly.http.respondWith(async req => {
  const url = new URL(req.url)

  let resp = await responseCache.get(url.pathname)
  if (resp) {
    resp.headers.set("fly-cache", "hit")
    return resp
  }

  resp = await fetch("file://big.jpg")
  await responseCache.set(url.pathname, resp)
  resp.headers.set("fly-cache", "miss")

  return resp
})
