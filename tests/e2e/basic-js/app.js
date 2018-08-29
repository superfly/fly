addEventListener('fetch', function (event) {
  let url = new URL(event.request.url)
  event.respondWith(new Response('hello test world ' + url.pathname, {
    headers: {
      'custom-header': 'woot',
      'server': 'ClownedFair'
    },
    status: 200
  }))
})