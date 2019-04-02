import * as path from "path"
import { readFileSync } from "fs"

describe("get", () => {
  setupApps({
    "edge.local": path.resolve(__dirname, "cache.edge.js"),
    "origin.local": path.resolve(__dirname, "files")
  })

  test("first request is a miss, second request is a hit", async () => {
    const response = await fetch("http://edge.local/big.jpg")
    expect(response.status).toEqual(200)
    expect(response.headers.get("fly-cache")).toEqual("miss")
    expect(response.headers.get("content-type")).toEqual("image/jpeg")
    expect(await response.text()).toEqual(readFileSync(path.resolve(__dirname, "files", "big.jpg")).toString())
    const response2 = await fetch("http://edge.local/big.jpg")
    expect(response2.status).toEqual(200)
    expect(response2.headers.get("fly-cache")).toEqual("hit")
    expect(await response2.text()).toEqual(readFileSync(path.resolve(__dirname, "files", "big.jpg")).toString())
  })
})

describe("delete", () => {
  setupApps({
    "edge.local": path.resolve(__dirname, "cache.edge.js"),
    "origin.local": path.resolve(__dirname, "files")
  })

  test("delete", async () => {
    const response = await fetch("http://edge.local/big.jpg")
    expect(response.status).toEqual(200)
    expect(response.headers.get("fly-cache")).toEqual("miss")

    const response2 = await fetch("http://edge.local/big.jpg", { method: "DELETE" })
    expect(response2.status).toEqual(204)

    const response3 = await fetch("http://edge.local/big.jpg")
    expect(response3.status).toEqual(200)
    expect(response3.headers.get("fly-cache")).toEqual("miss")
    expect(await response.text()).toEqual(await response3.text())
  })
})
