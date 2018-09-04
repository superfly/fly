import { AppConfig } from "@fly/test-server"
import * as path from "path"
import { StringDecoder } from "string_decoder"

declare function setupApps(appConfig: AppConfig): void

setupApps({
  "edge.test": path.resolve(__dirname, "basic.js"),
})

describe("Cache API", () => {
  test("set+get", async () => {
    const value = "hello cache!"
    const setResponse = await fetch("http://edge.test/set/hello", {
      method: "POST",
      body: value
    })
    expect(setResponse.status).toEqual(201)

    const getResponse = await fetch("http://edge.test/get/hello")
    expect(getResponse.status).toEqual(200)
    expect(await getResponse.text()).toEqual(value)
  })

  test("get with missing key", async () => {
    const getResponse = await fetch("http://edge.test/get/invalid-key")
    expect(getResponse.status).toEqual(404)
  })

  test("set with ttl", async () => {
    const value = "ttl!"
    const setResponse = await fetch("http://edge.test/set/hello-with-ttl?ttl=30", {
      method: "POST",
      body: value
    })
    expect(setResponse.status).toEqual(201)

    const getResponse = await fetch("http://edge.test/get/hello-with-ttl")
    expect(getResponse.status).toEqual(200)

    const ttl = await getServer("edge.test").cacheStore.ttl("hello-with-ttl")

    expect(ttl).toEqual(30)
  })

  test("set a yuge value", async () => {
    const value = "f".repeat(2.1 * 1024 * 1024)
    const setResponse = await fetch("http://edge.test/set/yuge", {
      method: "POST",
      body: value
    })
    expect(setResponse.status).toEqual(201)

    const getResponse = await fetch("http://edge.test/getString/yuge")
    expect(getResponse.status).toEqual(200)
    expect(await getResponse.text()).toEqual(value)
  })

  test("delete", async () => {
    const setResponse = await fetch("http://edge.test/set/delete-me", {
      method: "POST",
      body: "delete me!"
    })
    expect(setResponse.status).toEqual(201)

    const deleteResp = await fetch("http://edge.test/del/delete-me")
    expect(deleteResp.status).toEqual(202)
  })

  test("delete with missing key", async () => {
    const deleteResp = await fetch("http://edge.test/del/not-a-key")
    expect(deleteResp.status).toEqual(400)
  })
  test("get handles corrupt data", async () => {
    const data = new Buffer([-1, -1, -1, -1])
    // this is a hack for adding bad data to the cache, not sure if we need to expose the cache otherwise?
    const ok = await getServer("edge.test").cacheStore.set("corrupt", data)
    if (!ok) {
      fail("didn't set cache for some reason")
    }

    const response = await fetch("http://edge.test/get/corrupt")
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual(data.toString("utf8"))
  })

  test("getString handles corrupt data", async () => {
    const data = new Buffer([-1, -1, -1, -1])
    // this is a hack for adding bad data to the cache, not sure if we need to expose the cache otherwise?
    const ok = await getServer("edge.test").cacheStore.set("corrupt-get-string", data)
    if (!ok) {
      fail("didn't set cache for some reason")
    }
    const response = await fetch("http://edge.test/getString/corrupt-get-string")
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual(data.toString("utf8"))
  })
})
