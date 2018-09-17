fly.http.respondWith(async function (req) {
  const opts = {
    timeout: parseInt(req.headers.get("timeout")),
    readTimeout: parseInt(req.headers.get("read-timeout"))
  }

  const readDelay = parseInt(req.headers.get("delay")) || 0
  const origin = req.headers.get("origin") || "http://origin.test"

  try {
    const resp = await fetch(origin, opts)
    if (readDelay > 0) {
      await new Promise(res => setTimeout(res, readDelay))
    }
    const txt = await resp.text()
    return new Response(`Size: ${txt.length}`, resp)
  } catch (err) {
    if (err instanceof TimeoutError) {
      return new Response("fetch timeout", { status: 502 })
    } else if (err.message.includes("stream closed")) {
      return new Response("read timeout", { status: 504 })
    }
    return new Response(err.toString(), { status: 500 })
  }
})
