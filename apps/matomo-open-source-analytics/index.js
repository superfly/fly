import analytics from './matomo'

/* loader.io load-testing verification key */
fly.http.respondWith(async (req) => {
  const url = new URL(req.url)

  url.port = 3000 // my local dev port

  const isGif = url.href.match(/\/user\/.*\.gif/g)
  const isScript = url.href.match(/\.*\.js/g)


  console.log(`

    url.href, ${url.href}

  `)

  const requested = await fetch(url.href)
  const requestedPage = await requested.text()

  if (!isGif && !isScript) {
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
