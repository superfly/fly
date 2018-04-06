import { expect } from 'chai'

describe("Request", () => {
  const text = "helloFLY"
  const buffer = new TextEncoder("utf-8").encode(text).buffer
  const buffer16 = new TextEncoder("utf-16").encode(text).buffer
  const buffer32 = new TextEncoder("utf-32").encode(text).buffer
  const buffer64 = new TextEncoder("utf-64").encode(text).buffer

  it("can be instantiated", () => {
    expect(new Request("http://example.com")).not.to.throw
  })

  it("sets body properly from intializing request", () => {
    const r = new Request("https://example.com", { body: "ahoyhoy", method: "post"})
    const req = new Request(r)

    expect(req.bodySource).to.eq(r.bodySource)
  })

  it('returns an ArrayBuffer given a Int8Array', async () => {
    const r = new Response(new Int8Array(buffer))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })

  it('returns an ArrayBuffer given a Int16Array', async () => {
    const r = new Response(new Int16Array(buffer))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })

  it('returns an ArrayBuffer given a Int32Array', async () => {
    const r = new Response(new Int32Array(buffer))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })

  it('returns an ArrayBuffer given a Uint8Array', async () => {
    const r = new Response(new Uint8Array(buffer))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })

  it('returns an ArrayBuffer given a Uint16Array', async () => {
    const r = new Response(new Uint16Array(buffer16))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })

  it('returns an ArrayBuffer given a Uint32Array', async () => {
    const r = new Response(new Uint32Array(buffer))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })

  it('returns an ArrayBuffer given a Uint8ClampedArray', async () => {
    const r = new Response(new Uint8ClampedArray(buffer))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })

  it('returns an ArrayBuffer given a Float32Array', async () => {
    const r = new Response(new Float32Array(buffer))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })

  it('returns an ArrayBuffer given a Float64Array', async () => {
    const r = new Response(new Float64Array(buffer))

    expect(new TextDecoder("utf-8").decode(await r.arrayBuffer())).to.equal(text)
  })
})

function ab2str(buf) {
  return String.fromCharCode.apply(null, buf);
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
