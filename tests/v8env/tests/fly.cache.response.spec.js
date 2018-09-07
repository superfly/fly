import { expect } from 'chai'

import cache, { responseCache } from "@fly/cache"

let counter = 0
async function makeResponse() {
  let key = `cache-test-key-${counter++}`
  const resp = new Response("hi", { status: 404 })
  const setResult = await responseCache.set(key, resp)

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