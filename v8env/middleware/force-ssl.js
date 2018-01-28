async function forceSSL(req, next){
  let url = new URL(req.url)
  const proto = url.protocol.slice(0, url.protocol.length - 1)
  const xProto = req.headers.get("x-forwarded-proto")

  if(proto != "https" && xProto != "https"){
    url.protocol = "https"
    return new Response("redirecting", {status: 308, headers: {
      location: url.toString()
    }})
  }else{
    return await next(req)
  }
}
module.exports = function(){
  registerMiddleware("force-ssl", function(){ return forceSSL }())
}