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
    expect(setResult).to.eq(true, "couldn't set test value")
    const result = await cache.getString("cache-test-key")

    expect(result).to.eq(v)
  })

  it("deletes from cache", async () => {
    const v = `cache-value-woo! ${Math.random()}`

    const setResult = await cache.set("cache-delete-key", v)
    expect(setResult).to.eq(true)

    const result = await cache.del("cache-delete-key")

    expect(result).to.eq(true, "del should return true")

    let newVal = await cache.get("cache-delete-key")
    expect(newVal).to.eq(null, "previously deleted key should be null")
  })

  it("accepts empty arrayBuffer", async () => {
    const k = `cache-test${Math.random()}`

    await cache.set(k, new ArrayBuffer(0))

    const result = await cache.get(k)
    expect(result).to.be.a('ArrayBuffer')
    expect(result.byteLength).to.eq(0)
  })

  it("handles blank strings", async () => {
    const k = `cache-test${Math.random()}`
    await cache.set(k, '')
    const result = await cache.getString(k)
    expect(result).to.eq('')
  })

  it("handles set.onlyIfEmpty", async () => {
    const k = `cache-test${Math.random()}`
    await cache.set(k, 'asdf')

    const setResult = await cache.set(k, 'jklm', { onlyIfEmpty: true })
    const v = await cache.getString(k)

    expect(setResult).to.eq(false)
    expect(v).to.eq("asdf")
  })

  it("gets multiple values", async () => {
    const k = `cache-test${Math.random()}`
    const k2 = `cache-test${Math.random()}`

    await cache.set(k, "multi-1")
    await cache.set(k2, "multi-2")

    const result = await cache.getMultiString([k, k2])
    expect(result).to.be.an('array')

    const [r1, r2] = result;
    expect(r1).to.eq("multi-1")
    expect(r2).to.eq("multi-2")
  })
})