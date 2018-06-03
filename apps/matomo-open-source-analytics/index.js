import analytics from './matomo'

/* This will be the destination, where we want users to go. */
const HOST = 'https://onehostname.com'

/* loader.io load-testing verification key */
fly.http.respondWith(async (req) => {
  const url = new URL(req.url)
  const host = new URL(HOST)

  /* We transform parts of the request URL, but keep the pathname */
  url.hostname = host.hostname
  url.port = host.port
  url.protocol = host.protocol

  const request = new Request(req)

  /* Now we traform parts of the request with the new url. */
  request.url = url.href
  request.headers.delete('host')
  request.headers.append('host', url.hostname)

  const response = await fetch(request)
  const data = await response.arrayBuffer()

  /* I don't necessarily want to track every image and script request. */
  const isImage = url.href.match(/\.(gif|jpg|jpeg|png)/g)
  const isScript = url.href.match(/\.js/g)

  if (!isImage && !isScript) {
    try {
      /* The ./matomo.js file is what you should check out for using the tracker itself. */
      await analytics(req, false)
    } catch (error) {
      console.error(error)
    }
  }

  /* Return the requested assets to the visitor. */
  return new Response(data, {
    status: 200,
    headers: response.headers
  })
})
