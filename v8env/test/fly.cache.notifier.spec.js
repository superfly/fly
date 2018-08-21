import { expect } from "chai"

import cache from "@fly/cache"

function sleep(timeout) {
  return new Promise((resolve, ) => {
    setTimeout(resolve, timeout)
  })
}
describe("@fly/cache/global", () => {
  it("sends del notification", async () => {
    const key = "notifier_test_key_" + Math.random()
    await cache.set(key, "asdf")
    await cache.global.del(key)

    // TODO: this can be race-y, global del is not guaranteed to happen before the next read
    await sleep(20)
    const res = await cache.getString(key)
    expect(res).to.eq(null)

  })

  it("sends purgeTag notifications", async () => {
    const key = "purge_test_key_" + Math.random()
    await cache.set(key, "jklm", { tags: ["purge_test"] })

    await cache.global.purgeTag("purge_test")

    await sleep(20)
    const res = await cache.getString(key)
    expect(res).to.eq(null)
  })
})