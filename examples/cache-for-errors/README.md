# Example: Cache instead of erroring

Fly apps can be used to mask downtime caused by backend services. One technique for handling backend errors is to cache known good responses, and serve those in place of transient backend errors.

This example uses the `fly.cache` API to store good HTTP respomses.

## Running the example

* Start the server `fly server cache-for-errors`
* Visit these URLs:
  * http://localhost:3000/?status=500 (this returns a 500 error page)
  * http://localhost:3000/ (this returns a good response)
  * http://localhost:3000/?status=500 (this returns a cached response instead of erroring again)

The first URL returns an error because the cache is empty. The second URL gets a good response, and stores it in the cache. The third tries the request, detects an error code, and returns good cached content.

You can try this with `curl` to see the `origin-status` header the app sets when serving fallback contnet.:

```bash
➜ curl -D - http://localhost:3000/\?status\=500
HTTP/1.1 200 OK
age: 18
fly-age: 18
origin-status: 500
Date: Mon, 11 Jun 2018 18:56:07 GMT

hello from http://localhost:3000/ on Mon Jun 11 2018 13:55:49 GMT-0500 (CDT)
```

## How it works

The `fly.cache` API accesses regional Fly cache storage. This example application stores "good" HTTP responses in the cache without setting an expiration time, so the data sticks around semi-permanently.

When the app receives a request, it proxies it to the origin. If the origin sends back an error, the app checks for cache data before serving the error.

Each time a successful request passes through, the app stores the response for later.

## Where to go from here

This example demonstrates trying requests, then going to different sources when the response is bad. You can use similar techniques to implement retries (try a backend, if it fails, try another backend).