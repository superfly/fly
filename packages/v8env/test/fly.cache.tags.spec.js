
import { expect } from 'chai'
import cache from '@fly/cache'

describe("@fly/cache#tags", () => {
  it("purges tags", async () => {
    const k = `cache-test${Math.random()}`
    const v = `cache-value-woo! ${Math.random()}`

    const s = `cache-test${Math.random()}`
    await cache.set(k, v, { tags: [s] })

    let r = await cache.getString(k)
    expect(r).to.eq(v)

    const purged = await cache.purgeTag(s)
    expect(purged).to.includes(k)
    r = await cache.getString(k)
    expect(r).to.eq(null)
  })

  it("ignores stale tags", async () => {
    const k = `cache-test${Math.random()}`
    let v = `cache-value-woo! ${Math.random()}`
    const s = `cache-test${Math.random()}`

    // set it with tags
    await cache.set(k, v, { tags: [s] })

    // set it without
    await cache.set(k, v)

    const purged = await cache.purgeTag(s)
    expect(purged).to.not.includes(k)

    let v2 = await cache.getString(k)

    expect(v2).to.not.be.null
    expect(v2).to.eq(v, "post-purge value is wrong")
  })
})