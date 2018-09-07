import * as path from "path"

setupApps({
  "edge.test": path.resolve(__dirname, "proxy.js"),
  "origin.test": path.resolve(__dirname, "headers.js")
})

describe.each(["edge.test", "origin.test"])("Headers to %s", (host) => {
  test(`custom header in request`, async () => {
    const response = await fetch(`http://${host}`, {
      headers: {
        "my-header": "my-value"
      }
    })
    expect(response.status).toEqual(200)
    const responseData = await response.json()
    expect(responseData).toHaveProperty("my-header", ["my-value"])
  })

  test(`custom header in response`, async () => {
    const response = await fetch(`http://${host}?foo=bar`)
    expect(response.status).toEqual(200)
    expect(response.headers.get("foo")).toEqual("bar")
  })
})
