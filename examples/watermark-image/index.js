import { Image } from '@fly/image'

const pictureURL = "https://raw.githubusercontent.com/superfly/fly/147f2a327dc76ce6cf10c46b7ea1c19a9d8f2d87/v8env_test/fixtures/picture.jpg"
const logoURL = "https://raw.githubusercontent.com/superfly/fly/147f2a327dc76ce6cf10c46b7ea1c19a9d8f2d87/v8env_test/fixtures/overlay.png"

fly.http.respondWith(async function (req) {
  const url = new URL(req.url)

  if (url.pathname == "/picture.jpg") {
    return watermarkPicture(req.headers.get("accept"))
  }

  return new Response("not found", { status: 404 })
})

async function watermarkPicture() {
  const [picture, logo] = await Promise.all([
    loadImage(pictureURL),
    loadImage(logoURL)
  ])

  const meta = picture.metadata()

  const padPct = 0.1
  const padding = {
    top: parseInt(meta.height * padPct),
    bottom: parseInt(meta.height * padPct),
    left: parseInt(meta.width * padPct),
    right: parseInt(meta.width * padPct)
  }

  logo.extend(padding).background({ r: 0, g: 0, b: 0, alpha: 0 })

  picture.overlayWith(logo, { gravity: Image.gravity.southeast })

  const body = await picture.toBuffer()

  return new Response(body.data, {
    headers: {
      "Content-Type": "image/jpg"
    }
  })
}

async function loadImage(url) {
  const resp = await fetch(url)
  if (resp.status != 200) {
    throw new Error("Couldn't load image: " + url)
  }
  const body = await resp.arrayBuffer()

  return new Image(body)
}