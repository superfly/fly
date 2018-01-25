function notAsync(req, next) {
  return new Response("hello test world " + req.url)
}

let mwChain = new MiddlewareChain();

mwChain.use(notAsync);

addEventListener('fetch', function (event) {
  event.respondWith(mwChain.run(event.request));
});