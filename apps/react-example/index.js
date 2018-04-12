fly.http.respondWith(async (req) => {
  const pathname = new URL(req.url).pathname.substr(1)
  if (pathname === '') return await fetch("file://index.html")
  const file = await fetch("file://" + pathname)
  if (file.status !== 404) return file
  return new Response("not found", { status: 404 })
})
