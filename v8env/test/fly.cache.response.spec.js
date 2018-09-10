import { expect } from 'chai'

import cache, { responseCache } from "@fly/cache"

let counter = 0
async function makeResponse(initResponseOptions, setCacheOptions) {
  let key = `cache-test-key-${counter++}`
  const responseInitOptions = Object.assign({ status: 404 }, initResponseOptions)
  const resp = new Response("hi", responseInitOptions)
  const setResult = await responseCache.set(key, resp, setCacheOptions)

  expect(setResult).to.eq(true)
  return [key, resp]
}
describe("@fly/cache/response", () => {
  it("sets a Response", async () => {
    const [key, resp] = await makeResponse()
    const cachedResponse = await responseCache.get(key)

    expect(cachedResponse).instanceOf(Response)
    const cachedBody = await cachedResponse.text()
    const body = await resp.text()

    expect(cachedBody).to.eq(body)
    expect(cachedResponse.status).to.eq(404)
  })

  it("sets a Response with headers", async () => {
    const [key, resp] = await makeResponse({ headers: { "authorization": "foo", "content-type": "text/plain; charset=utf-8" } })
    const cachedResponse = await responseCache.get(key)

    expect(cachedResponse).instanceOf(Response)
    const cachedBody = await cachedResponse.text()
    const body = await resp.text()

    expect(cachedBody).to.eq(body)
    expect(cachedResponse.status).to.eq(404)

    const meta = await responseCache.getMeta(key)
    expect(meta.headers["authorization"]).to.eq(undefined)
    expect(meta.headers["content-type"]).to.eq("text/plain; charset=utf-8")
  })

  it("sets a Response with headers, and custom skip-headers", async () => {
    const [key, resp] = await makeResponse({
      headers: {
        "authorization": "foo",
        "content-type": "text/plain; charset=utf-8",
        "content-length": "538",
        "content-encoding": "gzip"
      }
    }, { skipCacheHeaders: ["content-length"] })
    const cachedResponse = await responseCache.get(key)

    expect(cachedResponse).instanceOf(Response)
    const cachedBody = await cachedResponse.text()
    const body = await resp.text()

    expect(cachedBody).to.eq(body)
    expect(cachedResponse.status).to.eq(404)

    const meta = await responseCache.getMeta(key)
    expect(meta.headers["authorization"]).to.eq(undefined)
    expect(meta.headers["content-length"]).to.eq(undefined)
    expect(meta.headers["content-type"]).to.eq("text/plain; charset=utf-8")
    expect(meta.headers["content-encoding"]).to.eq("gzip")
  })

  it("deletes a response", async () => {
    const [key, resp] = await makeResponse()
    const delResult = await responseCache.del(key)
    expect(delResult).to.eq(true)

    const meta = await cache.get(key + ":meta")
    expect(meta).to.eq(null)

    const body = await cache.get(key + ":body")
    expect(body).to.eq(null)
  })

})