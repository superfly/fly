addEventListener('fetch', async (event) => {
  try{
    let res = await fetch("http://127.0.0.1:3333/", { headers: { host: "test" }})
    event.respondWith(res)
  }catch(err){
    event.respondWith(new Response(err.toString(), {status: 500}))
  }
})