import { expect } from 'chai'

describe("require fly", () => {
  it("requires fly.Image", () => {
    const { Image } = require("@fly/image")
    expect(typeof Image).to.eq("function")
    expect(new Image()).to.be.instanceOf(Image)
  })
})