fly.http.respondWith(async (req) => {
  const ttf = await fetch("file://VeraSeBd.ttf")
  const font = new fly.Font(await ttf.arrayBuffer())
  const subset = await font.subset('test')
  return new Response(new Buffer(subset, 'binary'), { header: { 'Content-Type': 'binary' }, status: 200})
})
