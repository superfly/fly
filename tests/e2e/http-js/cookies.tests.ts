import { AppConfig } from "@fly/test-server"
import * as path from "path"

declare function setupApps(appConfig: AppConfig): void

setupApps({ "edge.test": path.resolve(__dirname, "cookies.js") })

describe("Cookies", () => {
  test(`returns the cookie value`, async () => {

    const response = await fetch(`http://edge.test`, {
      headers: {
        cookie: "foo=bar;hello=world"
      }
    })
    expect(response.status).toEqual(200)
    expect(response.headers.get("set-cookie")).toEqual("hola=que%20tal; Max-Age=1000")
    expect(await response.text()).toEqual("bar world")
  })
})
