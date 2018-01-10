addEventListener('fetch', async function (event) {
  const foo = event.request.cookies.get("foo").value
  const hello = event.request.cookies.get("hello").value

  let res = new Response(`${foo} ${hello}`)
  res.cookies.append("hola", "que tal", { maxAge: 1000 })

  event.respondWith(res)
})