import * as path from "path"

describe("setTimeout after response", () => {
  setupApps({
    "edge.local": path.resolve(__dirname, "after-response.js")
  })

  test("callback is fired after response", async () => {
    const response = await fetch(`http://edge.local`)

    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual("no")

    await new Promise(res => setTimeout(res, 100))

    const response2 = await fetch(`http://edge.local`)
    expect(response2.status).toEqual(200)
    expect(await response2.text()).toEqual("yes")
  })
})
