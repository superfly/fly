import { AppConfig } from "@fly/test-server"
import * as path from "path"
import * as fs from "fs"

declare function setupApps(appConfig: AppConfig): void

setupApps({
  "edge.test": path.resolve(__dirname, "files"),
})

describe("fetch file://", () => {
  test("returns a valid file", async () => {
    const response = await fetch("http://edge.test/alice.txt")
    expect(response.status).toEqual(200)
    const filePath = path.resolve(__dirname, "files", "alice.txt")
    expect(await response.text()).toEqual(fs.readFileSync(filePath).toString())
  })

  test("returns 404 on missing file", async () => {
    const response = await fetch("http://edge.test/missing")
    expect(response.status).toEqual(404)
  })
})
