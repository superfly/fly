import { expect } from 'chai'

const logo = require("./fixtures/logo.png")
const Image = fly.Image
describe("Image", () => {
  it("resize()", async() => {
    const img = new Image(logo)
    const img2 = await img.resize(128, null, {kernel: 'nearest'}).webp().toImage()
    expect(img2.data.byteLength).to.be.lessThan(logo.byteLength)
    expect(img2.info.width).to.eq(128)
    expect(img2.info.format).to.eq("webp")
  })

  it("withoutEnlargement().resize()", async () => {
    const img = new Image(logo)
    const img2 = await img.withoutEnlargement().resize(512).toImage()
    expect(img2.info.width).to.eq(256)
  })

  it("crop()", async () => {
    const img = new Image(logo)
    const img2 = await img.resize(128, 64).crop(Image.strategy.entropy).toImage()
    expect(img2.info.width).to.eq(128)
    expect(img2.info.height).to.eq(64)
  })

  it("errors with bad ops", async ()=> {
    let err = null
    try{
      const img = new Image(logo)
      img.operations.push({name: "naughty", args: []})
      const p = await img.toBuffer()
    }catch(e){
      err = e
    }
    expect(err).to.not.be.null
    expect(err.toString()).to.include("Invalid image operation")
  })

  it("errors with bad data", async () => {
    let err = null
    const buf = new ArrayBuffer(10)
    for(var i = 0; i < 10; i ++){
      buf[i] = i
    }
    try{
      let img = new Image(buf)
      img = img.resize(20)
      const p = await img.toBuffer()
    }catch(e){
      err = e
    }

    expect(err).to.not.be.null
    expect(err.toString()).to.include("unsupported image format")
  })//*/
})