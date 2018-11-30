# Fly Standard Library

These are API docs for the [Fly runtime](https://github.com/superfly/fly) JavaScript environment. The runtime implements portions of standard web APIs (like `fetch`), and additional APIs for doing Fly specific operations.

## Basic app

```javascript
fly.http.respondWith(function(request){
  return new Response("Hello! We support whirled peas.", { status: 200})
})
// if you'd prefer to be service worker compatibility, this is also supported:
// around addEventListener('fetch', function(event){})
```

## `fetch` function

The [`fetch`](modules/fetch.html) function is available within Fly apps for making HTTP requests.

```javascript
fly.http.respondWith(async function(req){
  const resp = await fetch("http://example.com")
  resp.headers.set("fly-ified", "darn tootin'")
  return resp
})
```

It's an enhanced version of the standard Web API [`fetch` function](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).

## Primary APIs

* [`fly/cache`](modules/fly_cache.html): a regional, in memory cache for low latency reads/writes
* [`fly/data`](modules/fly_data.html): a global persistent key/value store for permanent data
* [`fly/image`](modules/fly_image.html): Image manipulation APIs
* [`fly/fetch`](modules/fly_fetch.html): libraries for routing and proxying fetch requests
