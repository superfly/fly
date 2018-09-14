import { expect } from 'chai'

describe("Headers", () => {
  it('gets a single value correctly', () => {
    const headers = new Headers()
    headers.set("test", "just-the-one")
    expect(headers.get("test")).to.eq("just-the-one")
  })
  it("gets multiple values correctly", () => {
    const headers = new Headers()
    headers.append("test", "value1")
    headers.append("test", "value2")
    headers.append("test", "value3")

    expect(headers.get("test")).to.eq("value1, value2, value3")
  })
})