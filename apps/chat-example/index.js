fly.http.respondWith(async (req) => {
  const res = await fetch("file://index.html")
  res.headers.set("content-type", "html")
  return res
})
