import { expect } from 'chai'

describe("Request", () => {
  it("can be instantiated", () => {
    expect(new Request("http://example.com")).not.to.throw
  })
})