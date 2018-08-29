import { runApps } from "@fly/test-server"
import * as path from "path"
const apps = {
  "edge.test": path.resolve(__dirname, "../app.js")
}

test("hello", async () => {
  console.log(__filename)
  runApps(apps, async (ctx) => {
    const response = await ctx.fetch("http://edge.test/")
    expect(response.status).toEqual(200)
    expect(response.headers.get('custom-header')).toEqual("woot")
    expect(await response.text()).toEqual("hello test world /")
  })
})
