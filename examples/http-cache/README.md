# HTTP caching example

The Fly runtime includes and implementation of the Web Cache API. This is useful for caching full HTTP responses, like you would with a caching proxy (Varnish, nginx, etc).

## Running the example

* Start the server: `fly server http-cache`
* Visit these URLs:
  * http://localhost:3000/ (Cached for 10 min, the message stays the same between reloads)
  * http://localhost:3000/never-cache (An uncacheable response, time changes on every reload)

You can also run `curl -D - http://localhost:3000/` to see cache control headers, including an `Age` (time since cached) and a `Cache: HIT/MISS` (indicates cache status). The cacheable response sets `Cache-Control: max-age=600`,  indicating it can be cached for up to 10 minutes.

## How it works

The HTTP cache API uses the lower leve `fly.cache` under the hood. `fly.cache` is an API for storing data in Fly's regional caches. HTTP caching uses data from the `Request` to generate a unique cache key, then stores the response metadata dn body in Fly cache.

## Where to go from here

HTTP caching is a good caching shortcut, and well suited for static sites. For more dynamic applications, it's better to use the `fly.cache` interface directly.