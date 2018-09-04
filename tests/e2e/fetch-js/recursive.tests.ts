import { AppConfig } from "@fly/test-server"
import * as path from "path"

declare function setupApps(appConfig: AppConfig): void

setupApps({
  "edge.test": path.resolve(__dirname, "recursive.js")
})

describe("recursive fetch", () => {
  test("fails without fly-allow-recursion header", async () => {
    const response = await fetch("http://edge.test")
    expect(response.status).toEqual(400)
    expect(await response.text()).toMatch("Too much recursion")
  })

  test("succeeds with fly-allow-recursion header", async () => {
    const response = await fetch("http://edge.test/wheader")
    expect(response.status).toEqual(200)
  })
})
