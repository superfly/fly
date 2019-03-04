import * as path from "path"

const timerTolerance = 250 // ms

describe("setTimeout", () => {
  setupApps({
    "set-timeout.local": path.resolve(__dirname, "setTimeout.js")
  })
  test.each([1000, 500, 0])("with %dms delay", async timeout => {
    const response = await fetch(`http://set-timeout.local?t=${timeout}`)
    expect(response.status).toEqual(200)
    const duration = parseInt(await response.text(), 10)
    expect(Math.abs(duration - timeout)).toBeLessThanOrEqual(timerTolerance)
  })
})

describe("clearTimeout", () => {
  setupApps({
    "clear-timeout.local": path.resolve(__dirname, "clearTimeout.js")
  })

  test("clearTimeout", async () => {
    const response = await fetch(`http://clear-timeout.local`)
    expect(response.status).toEqual(200)
    expect(await response.text()).toMatch("right callback")
  })
})

describe("setImmediate", () => {
  setupApps({
    "set-immediate.local": path.resolve(__dirname, "setImmediate.js")
  })

  test("setImmediate", async () => {
    const response = await fetch(`http://set-immediate.local`)
    expect(response.status).toEqual(200)
    expect(parseInt(await response.text(), 10)).toBeLessThanOrEqual(timerTolerance)
  })
})
