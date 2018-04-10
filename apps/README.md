# Example Apps
These are some example apps.

### Running the Apps
To run any of the apps, just run
```bash
fly server
```
And visit your app at [`localhost:3000`](http://localhost:3000).

### Pro Tip
If you make modifications to an app, fly will automatically update so all you need to do is reload the page.

### [Getting started](https://github.com/superfly/fly/tree/master/apps/getting-started)
The getting started app is a simple hello world app.
```JavaScript
fly.http.respondWith((req) =>
  new Response("Hello World", { status: 200})
)
```

### [Redirect](https://github.com/superfly/fly/tree/master/apps/redirect)
This app demonstrates how simple it is to redirect a request to another website.

### [Basic HTTP Caching](https://github.com/superfly/fly/tree/master/apps/caching)
This app shows the basics of caching responses to requests. It uses `cache.put` but, other methods are also available like `cache.add` and `fly.cache.set`.

Note: by default fly does not cache anything.

### [The Fly Fleet](https://github.com/superfly/fly/tree/master/apps/fly-fleet)
This app shows the fleet of fly servers all over the world. It also demonstrates how to serve files such as image, css, and html files.
