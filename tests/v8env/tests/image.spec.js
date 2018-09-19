import { expect } from "chai"

const logo = require("./fixtures/logo.png")
const picture = require("./fixtures/picture.jpg")
const overlay = require("./fixtures/overlay.png")
const { Image } = require("@fly/image")
describe("Image", () => {
  it("Image(create)", () => {
    const img = new Image({
      width: 200,
      height: 200,
      background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      channels: 4
    })

    const meta = img.metadata()
    expect(meta.width).to.eq(200)
    expect(meta.height).to.eq(200)
  })
  it("metadata()", () => {
    const img = new Image(logo)
    const meta = img.metadata()
    expect(meta.width).to.eq(256)
    expect(meta.format).to.eq("png")
  })

  it("resize()", async () => {
    const img = new Image(logo)
    const img2 = await img
      .resize(128, null, { kernel: "nearest" })
      .webp()
      .toImage()
    expect(img2.data.byteLength).to.be.lessThan(logo.byteLength)
    expect(img2.info.width).to.eq(128)
    expect(img2.info.format).to.eq("webp")
  })

  describe("scale()", () => {
    it("fit:contain", async () => {
      const img = new Image(picture)
      const meta = img.metadata()

      const scaled = await img.scale(500, 1000, { fit: Image.fit.contain }).toImage()
      const scaledMeta = scaled.metadata()

      expect(scaledMeta.width).to.eq(500)
      expect(scaledMeta.height).to.eq(335)

      const widthRatio = Math.round((meta.width / scaledMeta.width) * 10) / 10
      const heigthRatio = Math.round((meta.height / scaledMeta.height) * 10) / 10
      expect(widthRatio).to.eq(heigthRatio)
    })

    it("fit:cover", async () => {
      const img = new Image(picture)

      const scaled = await img.scale(100, 300, { fit: Image.fit.cover }).toImage()
      const scaledMeta = scaled.metadata()

      expect(scaledMeta.width).to.be.gte(100)
      expect(scaledMeta.height).to.be.gte(300)
    })

    it("fit:fill", async () => {
      const img = new Image(picture)

      const scaled = await img.scale(100, 300, { fit: Image.fit.fill }).toImage()
      const scaledMeta = scaled.metadata()

      expect(scaledMeta.width).to.eq(100)
      expect(scaledMeta.height).to.eq(300)
    })
  })

  it("flatten()", async () => {
    const img = new Image(logo)
    const img2 = await img
      .background({ r: 0, b: 0, g: 255, alpha: 1 })
      .flatten()
      .toImage()

    expect(img2.data.byteLength).to.not.eq(img.data.byteLength)
  })

  it("overlayWith()", async () => {
    const img = new Image(picture)
    const watermark = new Image(overlay)
    const meta = img.metadata()
    const wmeta = watermark.metadata()

    watermark
      .extend(parseInt(wmeta.width))
      .background({ r: 255, g: 255, b: 255, alpha: 0 })
      .embed()
    img.overlayWith(watermark, { gravity: Image.gravity.southeast })
    const img2 = await img.toBuffer()

    expect(img2.info.width).to.eq(meta.width)
  })

  it("withoutEnlargement().resize()", async () => {
    const img = new Image(logo)
    const img2 = await img
      .withoutEnlargement()
      .resize(512)
      .toImage()
    expect(img2.info.width).to.eq(256)
  })

  describe("crop()", () => {
    it("crops after resize", async () => {
      const img = new Image(logo)
      const img2 = await img
        .resize(128, 64)
        .crop(Image.strategy.entropy)
        .toImage()
      expect(img2.info.width).to.eq(128)
      expect(img2.info.height).to.eq(64)
    })
    it("crops with dimensions", async () => {
      const img = new Image(logo)
      const img2 = await img.crop(40, 40, Image.strategy.entropy).toImage()
      expect(img2.info.width).to.eq(40)
      expect(img2.info.height).to.eq(40)
    })
  })

  it("errors with bad ops", async () => {
    let err = null
    try {
      const img = new Image(logo)
      img._imageOperation("naughty")
    } catch (e) {
      err = e
    }
    expect(err).to.not.be.null
    expect(err.toString()).to.include("Invalid image operation")
  })

  it("errors with bad data", async () => {
    let err = null
    const buf = new ArrayBuffer(10)
    for (var i = 0; i < 10; i++) {
      buf[i] = i
    }
    try {
      let img = new Image(buf)
      img = img.resize(20)
      const p = await img.toBuffer()
    } catch (e) {
      err = e
    }

    expect(err).to.not.be.null
    expect(err.toString()).to.include("unsupported image format")
  }) //*/
})
