addEventListener('fetch', function (event) {
  let url = new URL(event.request.url)
  event.respondWith(new Response("hello test world " + url.pathname) // Oh no missing paren!
})