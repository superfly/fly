fly.log.addTransport("syslog", {
  host: "127.0.0.1",
  port: 3334,
  level: 'debug'
})

fly.log.addMetadata({ hello: "world" })

addEventListener('fetch', function (event) {
  console.log("yo")
  console.debug("debug test", { foo: "bar", hello: "notworld" })
  console.error(new Error("oh no").stack)
  event.respondWith(new Response())
})