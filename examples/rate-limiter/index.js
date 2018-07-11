import { throttle } from './lib/throttle'

var options = {
    requestLimit: 2,
    timePeriod: 5
}

const handler = () => new Response("Hello!")
const throttledHandler = throttle(handler, options)
fly.http.respondWith(throttledHandler)
