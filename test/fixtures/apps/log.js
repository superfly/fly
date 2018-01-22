let logs = []

addEventListener('log', (event) => {
  logs.push({ message: event.log.message, level: event.log.level })
})

addEventListener('fetch', (event) => {
  console.log('hello world')
  console.debug('debug world')
  setTimeout(function () {
    event.respondWith(new Response(JSON.stringify(logs), { headers: { "content-type": "application/json" } }))
  }, 10)
})