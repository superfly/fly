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

  return new Response(await request.text(), {})
})
