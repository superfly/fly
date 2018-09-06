import * as path from "path"
import * as fs from "fs"

describe("Invalid Apps", () => {
  const invalidApps = fs.readdirSync(path.resolve(__dirname, "invalid"))

  for (const appPath of invalidApps) {
    describe(appPath, () => {
      console.log("setup", appPath)
      setupApps({ "edge.test": path.resolve(__dirname, "invalid", appPath) })

      test("returns 500", async () => {
        const response = await fetch("http://edge.test")
        expect(response.status).toEqual(500)
      })
    })
  }
})

