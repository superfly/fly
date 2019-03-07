import * as path from "path"
import { readFileSync } from "fs"

setupApps({
  "edge.local": path.resolve(__dirname, "cache.edge.js"),
  "origin.local": path.resolve(__dirname, "files")
})

test("first request is a miss", async () => {
  const response = await fetch("http://edge.local/big.jpg")
  expect(response.status).toEqual(200)
  expect(response.headers.get("fly-cache")).toEqual("miss")
  expect(response.headers.get("content-type")).toEqual("image/jpeg")
  expect(await response.text()).toEqual(readFileSync(path.resolve(__dirname, "files", "big.jpg")).toString())
})

test("second request is a hit", async () => {
  const response = await fetch("http://edge.local/big.jpg")
  expect(response.status).toEqual(200)
  expect(response.headers.get("fly-cache")).toEqual("miss")
  const response2 = await fetch("http://edge.local/big.jpg")
  expect(response2.status).toEqual(200)
  expect(response2.headers.get("fly-cache")).toEqual("hit")
  expect(await response.text()).toEqual(await response2.text())
})
