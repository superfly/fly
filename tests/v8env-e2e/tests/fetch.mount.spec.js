import { expect } from 'chai'

import mount from '@fly/fetch/mount'

const mounts = mount({
  "/root/first-path/": (req, init) => new Response("/first-path/"),
  "/root/first-path/impossible": (req, init) => { throw new Error("no yuo") },
  "/root/another/": (req, init) => new Response("/another/"),
  "/root/": (req, init) => new Response("root")
})
describe("mount", () => {
  it("finds early path", async () => {
    const resp = await mounts("http://test/root/first-path/")
    const body = await resp.text()
    expect(body).to.eq("/first-path/")
  })
  it("finds later path", async () => {
    const resp = await mounts("http://test/root/another/thing/")
    const body = await resp.text()
    expect(body).to.eq("/another/")
  })
  it('falls through to default', async () => {
    const resp = await mounts("http://test/root/")
    const body = await resp.text()
    expect(body).to.eq("root")
  })
  it("404s when no match", async () => {
    const resp = await mounts("http://test/")
    expect(resp.status).to.eq(404)
  })
})