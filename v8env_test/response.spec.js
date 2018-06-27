import { expect } from 'chai'

describe("Response", () => {
  it("errors on unknown body types", () => {
    expect(() => new Response(1)).to.throw(/Bad Response body type/)
    expect(() => new Response(true)).to.throw(/Bad Response body type/)
    expect(() => new Response({})).to.throw(/Bad Response body type/)
    expect(() => new Response(["wat"])).to.throw(/Bad Response body type/)
  })
})