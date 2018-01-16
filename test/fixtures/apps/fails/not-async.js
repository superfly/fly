function notAsync(req, next) {
  return new Response("hello test world " + req.url)
}

let mwChain = new MiddlewareChain();

mwChain.use(notAsync);

addEventListener('fetch', async function (event) {
  let res = await mwChain.run(event.request);
  event.respondWith(res);
});