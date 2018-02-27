addEventListener('fetch', function (event) {
  event.respondWith(async function () {
    const req1 = event.request
    console.log("Cloning req")
    const req2 = req1.clone()
    const txt1 = await req1.text()
    const txt2 = await req2.text()
    console.log("txt1:", txt1, "txt2:", txt2)

    console.log("Request cloned")
    const res1 = new Response(`${txt1}${txt2}`)
    console.log("Cloning response:", res1.bodySource)
    const res2 = res1.clone()
    console.log("Response cloned")

    return new Response(`res1: ${await res1.text()}\nres2: ${await res2.text()}`)
  })
})