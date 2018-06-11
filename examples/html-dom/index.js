// respond to HTTP requests with HTML rendered from a template
fly.http.respondWith(async function (req) {
  const url = new URL(req.url)
  const template = await getTemplate()
  const doc = Document.parse(template)

  // some variables to insert into the template
  const variables = {
    firstName: url.searchParams.get("firstName") || "Frankie",
    time: new Date()
  }

  // iterate over the variables
  for (const v of Object.getOwnPropertyNames(variables)) {
    // find elements to replace with var
    const className = `.${v}`
    const elements = doc.querySelectorAll(className)
    for (const el of elements) {

      // replace element with variable contents
      el.replaceWith(variables[v]) // set value to innerHTML
    }
  }

  // turn DOM back into html string
  const html = doc.documentElement.outerHTML // gets outerHTML of root element
  return new Response(html, { headers: { "Content-Type": "text/html" } })
})

// loads the contents of template.html
async function getTemplate() {
  const resp = await fetch("file://template.html")
  return await resp.text()
}