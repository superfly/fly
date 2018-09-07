import * as path from "path"

setupApps({
  "edge.test": path.resolve(__dirname, "http.edge.js"),
  "origin.test": path.resolve(__dirname, "http.origin.js"),
})

describe("http caching", () => {
  test("matches cache if public", async () => {
    const response = await fetch("http://edge.test/public")
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual("hello from origin")
  })

  test("does not cache if not cacheable", async () => {
    const response = await fetch("http://edge.test/private")
    expect(response.status).toEqual(404)
    expect(await response.text()).toEqual("no match found")
  })
})
