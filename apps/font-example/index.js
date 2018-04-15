fly.http.respondWith(async (req) => {
  const html = await fetch('http://www.example.com/')
  const HTMLText = await html.text()
  const doc = Document.parse(HTMLText)
  const h1 = doc.querySelector('h1')
  const text = h1.textContent
  const ttf = await fetch('https://mdn.mozillademos.org/files/2468/VeraSeBd.ttf')
  const font = new fly.Font(await ttf.arrayBuffer())
  const subset = await font.subset(text, 'woff2')
  console.log('response with type', typeof subset)
  return new Response(new Buffer(subset, 'binary'), { header: { 'Content-Type': 'binary' }, status: 200})
})
