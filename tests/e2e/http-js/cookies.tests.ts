import * as path from "path"

setupApps({
  "edge.test": path.resolve(__dirname, "proxy.js"),
  "origin.test": path.resolve(__dirname, "cookies.js")
})

describe.each(["edge.test", "origin.test"])("Cookies to %s", (host) => {
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
