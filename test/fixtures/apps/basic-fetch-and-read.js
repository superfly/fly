fly.http.respondWith(async function(req){
  let resp = await fetch("https://example.com")
  let txt = await resp.text()
  console.log("Got text: ", txt.length)
  return new Response(txt, resp)
})
