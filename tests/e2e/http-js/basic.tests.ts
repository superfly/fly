import { AppConfig } from "@fly/test-server"
import * as path from "path"

declare function setupApps(appConfig: AppConfig): void

setupApps({
  "edge.test": path.resolve(__dirname, "proxy.js"),
  "origin.test": path.resolve(__dirname, "basic.js")
})

const methods = ["GET", "PUT", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"]
const statuses = [200, 300, 400, 500]

describe.each(["edge.test", "origin.test"])("Requests & Responses to %s", (host) => {
  for (const method of methods) {
    describe(method, () => {
      for (const status of statuses) {
        test(`${status} response`, async () => {
          const response = await fetch(`http://${host}/${status}`, { method: method })
          expect(response.status).toEqual(status)
          expect(response.headers.get("x-request-method")).toEqual(method)
        })
      }
    })
  }
})
