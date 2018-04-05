import { expect } from 'chai'

describe("Request", () => {
  it("can be instantiated", () => {
    expect(new Request("http://example.com")).not.to.throw
  })

  it("sets body properly from intializing request", () => {
    const r = new Request("https://example.com", { body: "ahoyhoy", method: "post"})
    const req = new Request(r)

    expect(req.bodySource).to.eq(r.bodySource)
  })

  it('returns an ArrayBuffer given a Uint8Array', async () => {
    const bodyText = "hello world"
    const r = new Response(new TextEncoder().encode(bodyText))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(bodyText)
  })
})
