import * as path from "path"

setupApps({
  "set-timeout.test": path.resolve(__dirname, "setTimeout.js"),
  "clear-timeout.test": path.resolve(__dirname, "clearTimeout.js"),
  "set-immediate.test": path.resolve(__dirname, "setImmediate.js"),
})

const timerTolerance = 100 // ms

describe("setTimeout", () => {
  test.each([250, 50, 0])("with %dms delay", async (timeout) => {
    const response = await fetch(`http://set-timeout.test?t=${timeout}`)
    expect(response.status).toEqual(200)
    const duration = parseInt(await response.text())
    expect(Math.abs((duration - timeout))).toBeLessThanOrEqual(timerTolerance)
  })
})

test("clearTimeout", async () => {
  const response = await fetch(`http://clear-timeout.test`)
  expect(response.status).toEqual(200)
  expect(await response.text()).toMatch("right callback")
})
test("setImmediate", async () => {
  const response = await fetch(`http://set-immediate.test`)
  expect(response.status).toEqual(200)
  expect(parseInt(await response.text())).toBeLessThanOrEqual(timerTolerance)
})

