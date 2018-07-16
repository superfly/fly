fly.http.respondWith(async function (req) {
  let url = new URL(req.url)

  let opts = {}

  if (req.headers.get("timeout")) {
    opts['timeout'] = parseInt(req.headers.get("timeout"))
  }
  try {
    let resp = await fetch("https://example.com", opts)
    let txt = await resp.text()
    console.log("Got text length:", txt.length)
    return new Response(txt, resp)
  } catch (err) {
    if (err instanceof TimeoutError) {
      return new Response("timeout", { status: 502 })
    }
  }
})