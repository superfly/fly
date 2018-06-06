import proxy from '@fly/proxy'

// the Glitch App URL
const glitchHost = "fly-example.glitch.me"

/* Deployment instructions */
// fly apps create <app-name>
// fly deploy
// fly hostnames add <your-custom-hostname.com>

// create a proxy fetch function to Glitch
const glitch = proxy(`https://${glitchHost}`,
  {
    headers: {
      'host': glitchHost, // set HOST header to glitchHost
      'x-forwarded-host': false // Don't send x-forwarded-host header
    }
  })

fly.http.respondWith(function (req) {
  // redirect to https
  let resp = requireSSL(req)
  if (resp) return resp

  // proxy to glitch
  return glitch(req)
})

function requireSSL(req) {
  const url = new URL(req.url)

  if (url.protocol != "https:") {
    url.protocol = "https"
    url.port = '443'
    if (app.env === "development") {
      console.log("Skipping SSL redirect in dev mode:", url.toString())
    } else {
      return new Response("Redirecting", {
        status: 301,
        headers: { "Location": url.toString() }
      })
    }
  }
}