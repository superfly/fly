fly.http.respondWith(async (request) => {
  const url = new URL(request.url)

  const delay = parseInt(url.searchParams.get("delay")) || 0
  if (delay > 0) {
    await new Promise(res => setTimeout(res, delay))
  }

  const length = parseInt(url.searchParams.get("length")) || 32

  return new Response(new ArrayBuffer(length), {
    headers: { "content-type": 'application/octet-stream' }
  })
})
