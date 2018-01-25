addEventListener("fetch", function (event) {
  event.respondWith(async function () {
    let document = await Document.parse(`<div id="woot">nice!</div><div id="woot2">nice2!</div>`)

    let elem = document.getElementById("woot")
    if (elem)
      elem.replaceWith(`<span>empty-ish span</span>`)
    return new Response(document.documentElement.outerHTML)
  })
})