import * as path from "path"

setupApps({
  "edge.local": path.resolve(__dirname, "proxy.js"),
  "origin.local": path.resolve(__dirname, "cookies.js")
})

describe.each(["edge.local", "origin.local"])("Cookies to %s", host => {
  test(`returns the cookie value`, async () => {
    const response = await fetch(`http://${host}`, {
      headers: {
        cookie: "foo=bar;hello=world"
      }
    })
    expect(response.status).toEqual(200)
    expect(response.headers.get("set-cookie")).toEqual("hola=que%20tal; Max-Age=1000")
    expect(await response.text()).toEqual("bar world")
  })
})
