fly.log.addTransport("syslog", {
  host: "127.0.0.1",
  port: 3334
})

addEventListener('fetch', function (event) {
  console.log("yo")
  event.respondWith(new Response())
})