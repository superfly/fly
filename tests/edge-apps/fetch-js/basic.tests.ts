import * as path from "path"

setupApps({
  "edge.local": path.resolve(__dirname, "basic.edge.js"),
  "origin.local": path.resolve(__dirname, "basic.origin.js")
})

test("read fetch response", async () => {
  const response = await fetch("http://edge.local", {
    headers: {
      origin: "http://origin.local?length=32"
    }
  })
  const body = await response.text()
  console.log("response", { body, status: response.status })
  expect(response.status).toEqual(200)
  expect(body).toEqual("Size: 32")
})

test(
  "read fetch response from a slow origin",
  async () => {
    const response = await fetch("http://edge.local", {
      headers: {
        origin: "http://origin.local?length=32&delay=2000"
      }
    })
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual("Size: 32")
  },
  60000
)

test("read fetch response from a slow origin with timeout", async () => {
  const response = await fetch("http://edge.local", {
    headers: {
      origin: "http://origin.local?length=32&delay=2000",
      timeout: "500"
    }
  })
  expect(response.status).toEqual(502)
  expect(await response.text()).toEqual("fetch timeout")
})

test("read fetch response after read timeout", async () => {
  const response = await fetch("http://edge.local", {
    headers: {
      "read-timeout": "20",
      delay: "50"
    }
  })
  expect(response.status).toEqual(504)
  expect(await response.text()).toMatch("read timeout")
})

test("read large fetch response", async () => {
  const response = await fetch("http://edge.local", {
    headers: {
      origin: "http://origin.local?length=20000000"
    }
  })
  expect(response.status).toEqual(200)
  expect(response.headers.get("content-type")).toEqual("application/octet-stream")
  expect(await response.text()).toEqual("Size: 20000000")
})

test.skip("bombs if fetching a relative path", async () => {
  const response = await fetch("http://edge.local", {
    headers: {
      origin: "/invalid/origin"
    }
  })
  expect(response.status).toEqual(500)
  expect(await response.text()).toMatch("ECONNREFUSED")
})
