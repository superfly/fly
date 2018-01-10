async function echo(req, next){
  console.log("echo middleware");
  console.log("settings:", typeof this.settings, this.settings.constructor.name, JSON.stringify(this.settings));
  let body = this.settings.get("body") || req.url,
      contentType = this.settings.get("contentType") || "text/html",
      status = this.settings.get("status");

  if (!status) {
    status = parseInt(req.url.match(/[^\/]+\/?$/)[0]) || 200;
  }
  return new Response(
    body,
    {
      headers: {
        "content-type": contentType
      },
      status: status
    }
  )
}
module.exports = function(){
  registerMiddleware("fly-echo", function(){
    return echo;
  }())
}