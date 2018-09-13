import { expect } from 'chai'

describe("TextDecoder", () => {
  it("can be instantiated", () => {
    const td = new TextDecoder()
  })

  it("decodes", () => {
    const td = new TextDecoder()
    expect(td.decode(new Uint8Array([104, 101, 108, 108, 111]))).to.equal("hello")
  })
})

describe("TextEncoder", () => {
  it("can be instantiated", () => {
    const te = new TextEncoder()
  })

  it("encodes", () => {
    const te = new TextEncoder()
    expect(te.encode("hello")).to.deep.equal(new Uint8Array([104, 101, 108, 108, 111]))
  })
})