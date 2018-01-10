addEventListener("fetch", async function (event) {
  let res = await fetch("https://example.com")

  let parser = new Document.Parser()

  parser.querySelector('h1', (elem) => {
    event.respondWith(new Response(elem.textContent))
  })

  parser.parse(res.body)
})