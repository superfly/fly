import * as path from "path"

setupApps({
  "edge.local": path.resolve(__dirname, "proxy.js"),
  "origin.local": path.resolve(__dirname, "basic.js")
})

const methods = ["GET", "PUT", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE"]
const statuses = [200, 300, 400, 500]
const hosts = ["edge.local", "origin.local"]

describe.each(hosts)("Requests & Responses to %s", host => {
  for (const method of methods) {
    describe(method, () => {
      for (const status of statuses) {
        test(`${status} response`, async () => {
          const response = await fetch(`http://${host}/${status}`, { method })
          expect(response.status).toEqual(status)
          expect(response.headers.get("x-request-method")).toEqual(method)
        })
      }
    })
  }
})
