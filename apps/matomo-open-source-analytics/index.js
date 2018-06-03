import analytics from './matomo'

/* loader.io load-testing verification key */
fly.http.respondWith(async (req) => {
  const url = new URL(req.url)

  url.port = 3000 // my local dev port

  const isImage = url.href.match(/\.(gif|jpg|jpeg|png)/g)
  const isScript = url.href.match(/\.js/g)

  const request = new Request(req)

  request.url = url.href
  request.headers.delete('host')
  request.headers.append('host', url.hostname)

  const requested = await fetch(request)
  const requestedPage = await requested.text()

  if (!isImage && !isScript) {
    try {
      await analytics(req, false)
    } catch (error) {
      console.error(error)
    }
  }

  return new Response(requestedPage, {
    status: 200
  })
})
