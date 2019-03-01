import * as path from "path"

setupApps({
  "edge.local": path.resolve(__dirname, "recursive.js")
})

describe("recursive fetch", () => {
  test("fails without fly-allow-recursion header", async () => {
    const response = await fetch("http://edge.local")
    expect(response.status).toEqual(400)
    expect(await response.text()).toMatch("Too much recursion")
  })

  test("succeeds with fly-allow-recursion header", async () => {
    const response = await fetch("http://edge.local/wheader")
    expect(response.status).toEqual(200)
  })
})
