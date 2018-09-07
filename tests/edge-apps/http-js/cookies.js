fly.http.respondWith(async (request) => {
  const foo = request.cookies.get("foo").value
  const hello = request.cookies.get("hello").value

  let res = new Response(`${foo} ${hello}`)
  res.cookies.append("hola", "que tal", { maxAge: 1000 })
  return res
})
