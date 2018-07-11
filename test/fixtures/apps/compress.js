addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname === '/') {
    event.respondWith(new Response("notcompressed", {
      headers: {
        "content-type": "text/plain",
        "wat": "wat"
      }
    }))
  } else if (url.pathname === "/image.jpg") {
    event.respondWith(new Response("pretend-image", {
      headers: {
        "content-type": "image/jpg",
        "wat": "wat"
      }
    }))
  }
})