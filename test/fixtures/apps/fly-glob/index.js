fly.http.respondWith((req) => {
	const path = new URL(req.url).pathname
	if (path !== '/') return getFile(path)
	return new Response('ERROR: not found', {
    status: 404
  })
})

async function getFile(path) {
  const file = await fetch('file:/' + path)
  const contents = await file.text()
  return new Response(contents, {
    headers: {
      "Content-Type": "text/html"
    }
  })
}
