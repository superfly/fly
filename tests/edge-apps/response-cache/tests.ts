import * as path from "path"
import * as fs from "fs"

setupApps({
  "edge.local": path.resolve(__dirname, "app")
})

test("origin response can be consumed by resp cache and response", async () => {
  const response = await fetch("http://edge.local/big.jpg")
  expect(response.status).toEqual(200)
  expect(response.headers.get("fly-cache")).toEqual("miss")
  const filePath = path.resolve(__dirname, "app", "big.jpg")
  expect(await response.text()).toEqual(fs.readFileSync(filePath).toString())
})

test("repeated requests are cached", async () => {
  await fetch("http://edge.local/big.jpg")
  const response = await fetch("http://edge.local/big.jpg")
  expect(response.status).toEqual(200)
  expect(response.headers.get("fly-cache")).toEqual("hit")
  const filePath = path.resolve(__dirname, "app", "big.jpg")
  expect(await response.text()).toEqual(fs.readFileSync(filePath).toString())
})
