async function voidReturn(req, resp) {

}

let mwChain = new MiddlewareChain();
mwChain.use(voidReturn);

addEventListener('fetch', function (event) {
  event.respondWith(mwChain.run(event.request));
});