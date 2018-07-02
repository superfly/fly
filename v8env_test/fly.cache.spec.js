import { expect } from 'chai'
import cache from '@fly/cache'

describe("@fly/cache", () => {
  it('allows fly.cache global access', () => {
    const c = fly.cache
    expect(typeof c.get).to.eq("function")
  })

  it("gets a string", async () => {
    const v = `cache-value-woo! ${Math.random()}`

    const setResult = await cache.set("cache-test-key", v)
    expect(setResult).to.eq(true)
    const result = await cache.getString("cache-test-key")

    expect(result).to.eq(v)
  })

  it("deletes from cache", async () => {
    const v = `cache-value-woo! ${Math.random()}`

    const setResult = await cache.set("cache-delete-key", v)
    expect(setResult).to.eq(true)

    const result = await cache.del("cache-delete-key")

    expect(result).to.eq(true)

    const newVal = await cache.get("cache-delete-key")
    expect(newVal).to.eq(null)
  })
})