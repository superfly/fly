import { AppConfig } from "@fly/test-server"
import * as path from "path"

declare function setupApps(appConfig: AppConfig): void

setupApps({ "edge.test": path.resolve(__dirname, "headers.js") })

describe("Headers", () => {
  test(`custom header in request`, async () => {
    const response = await fetch(`http://edge.test`, {
      headers: {
        "my-header": "my-value"
      }
    })
    expect(response.status).toEqual(200)
    const responseData = await response.json()
    expect(responseData).toHaveProperty("my-header", ["my-value"])
  })

  test(`custom header in response`, async () => {
    const response = await fetch(`http://edge.test?foo=bar`)
    expect(response.status).toEqual(200)
    expect(response.headers.get("foo")).toEqual("bar")
  })
})
