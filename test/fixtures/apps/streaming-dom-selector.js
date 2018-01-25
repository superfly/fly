addEventListener("fetch", function (event) {
  event.respondWith(function () {
    return new Promise(function (resolve) {
      fetch("https://example.com").then((res) => {
        let parser = new Document.Parser()

        parser.querySelector('h1', (elem) => {
          resolve(new Response(elem.textContent))
        })

        parser.parse(res.body)
      })
    })
  })
})