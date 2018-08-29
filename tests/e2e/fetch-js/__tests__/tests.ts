import { runApps } from "@fly/test-server"
import * as path from "path"

const apps = {
  "edge.test": path.resolve(__dirname, "../app.js"),
  "origin.test": path.resolve(__dirname, "../origin.js")
}

test("fetch from origin", async () => {
  await runApps(apps, async (env) => {
    const response = await env.fetch("http://edge.test/buttercup")
    expect(response.status).toEqual(200)
    expect(await response.text()).toEqual("hello from origin: /buttercup")
  })
})
