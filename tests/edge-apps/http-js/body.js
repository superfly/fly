fly.http.respondWith(async request => {
  const url = new URL(request.url)

  if (url.pathname.startsWith("/clone")) {
    const req1 = request
    const req2 = req1.clone()
    const txt1 = await req1.text()
    const txt2 = await req2.text()

    const res1 = new Response(`${txt1}${txt2}`)
    const res2 = res1.clone()

    return new Response(`res1: ${await res1.text()}\nres2: ${await res2.text()}`)
  }

  if (url.pathname.startsWith("/stream")) {
    let count = 0
    let timeout
    const write = function(controller) {
      controller.enqueue(`chunk ${count++}\n`)
      if (count < 3) {
        timeout = setTimeout(() => write(controller), 1000)
      } else {
        controller.close()
      }
    }
    // make a stream that waits 1s before writing
    const b = new ReadableStream({
      start(controller) {
        timeout = setTimeout(() => write(controller), 1000)
      },
      cancel() {
        if (timeout) {
          clearImmediate(timeout)
        }
      }
    })
    return new Response(b, {
      headers: {
        "content-type": "text/html",
        streaming: "true",
        "transfer-encoding": "chunked"
      }
    })
  }

  return new Response(await request.text(), {})
})
