fly.http.respondWith((req) => {
  const res = new Response("Hello World", { status: 200})
  let res = cache.match(req)
  if(!res){
    res = new Response("Hello World", { headers: {'X-Cache': 'miss'}, status: 200})
    cache.put(req, res)
  } else {
    res.setHeader('X-Cache', 'hit')
  }
  return res
})
