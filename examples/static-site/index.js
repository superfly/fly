import { staticServer } from "@fly/fetch"

const site = staticServer({ root: "/files/" })

fly.http.respondWith(site)