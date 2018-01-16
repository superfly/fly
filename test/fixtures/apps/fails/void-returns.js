async function voidReturn(req, resp){

}

let mwChain = new MiddlewareChain();
mwChain.use(voidReturn);

addEventListener('fetch', async function(event){
  let res = await mwChain.run(event.request);
  event.respondWith(res);
});