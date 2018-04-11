// fly.http.respondWith(async function(req){
//   let resp = await fetch("https://example.com/?gzip", { headers: {"Accept-Encoding": "gzip"}, inflate: true })
//   let txt = await resp.text()
//   console.log("Got text: ", txt.length)
//   return new Response(txt, resp)
// })

fly.http.respondWith(async function(req){
  let resp = await fetch(" https://example.com/?gzip", { headers: {"Accept-Encoding": "gzip"}, inflate: true })
  let txt = await resp.text()
  console.log("Got (gzip) text: ", txt)
  return new Response(txt, resp)
})
