import { AppConfig } from "@fly/test-server"
import * as path from "path"

declare function setupApps(appConfig: AppConfig): void

setupApps({
  "edge.test": path.resolve(__dirname, "basic.edge.js"),
  "origin.test": path.resolve(__dirname, "basic.origin.js")
})

describe("basic fetch", () => {
  test("read fetch response", async () => {
    const response = await fetch("http://edge.test", {
      headers: {
        "origin": "http://origin.test?length=32"
      }
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual("Size: 32")
  })

  test("read fetch response from a slow origin", async () => {
    const response = await fetch("http://edge.test", {
      headers: {
        "origin": "http://origin.test?length=32&delay=2000"
      }
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual("Size: 32")
  })

  test("read fetch response from a slow origin with timeout", async () => {
    const response = await fetch("http://edge.test", {
      headers: {
        "origin": "http://origin.test?length=32&delay=2000",
        "timeout": "500"
      }
    })
    expect(response.status).toEqual(502)
    expect(await response.text()).toEqual("fetch timeout")
  })

  test("read fetch response after read timeout", async () => {
    const response = await fetch("http://edge.test", {
      headers: {
        "read-timeout": "20",
        "delay": "50"
      }
    })
    expect(response.status).toEqual(504)
    expect(await response.text()).toMatch("read timeout")
  })

  test("read large fetch response", async () => {
    const response = await fetch("http://edge.test", {
      headers: {
        "origin": "http://origin.test?length=20000000"
      }
    })
    expect(response.status).toEqual(200)
    expect(response.headers.get("content-type")).toEqual("application/octet-stream")
    expect(await response.text()).toEqual("Size: 20000000")
  })

  test("bombs if fetching a relative path", async () => {
    const response = await fetch("http://edge.test", {
      headers: {
        "origin": "/invalid/origin"
      }
    })
    expect(response.status).toEqual(500)
    expect(await response.text()).toMatch("ECONNREFUSED")
  })
})
