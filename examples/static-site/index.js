import staticServer from "@fly/static"

const site = staticServer({ root: "/files/" })

fly.http.respondWith(site)