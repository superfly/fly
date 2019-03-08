import * as path from "path"

setupApps({
  "edge.local": path.resolve(__dirname, "invalid.edge.js")
})

test("fails with unknown prototol", async () => {
  const response = await fetch("http://edge.local")
  expect(response.status).toEqual(500)
  expect(await response.text()).toMatch(/unsupported protocol: nope:/i)
})
