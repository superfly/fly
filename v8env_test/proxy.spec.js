import { expect } from 'chai'

import * as proxy from '@fly/proxy'

const origin = "https://fly.io/proxy/"
const req = new Request("https://wat.com/path/to/thing", { headers: { "host": "wut.com" } })
describe("proxy", () => {
  it('includes host header and base path properly', () => {
    const breq = proxy.buildProxyRequest(origin, {}, req)
    const url = new URL(breq.url)
    expect(breq.headers.get("host")).to.eq("wut.com")
    expect(url.pathname).to.eq("/proxy/path/to/thing")
  })

  it('rewrite paths properly', () => {
    const breq = proxy.buildProxyRequest(origin, { rewritePath: "/path/to/" }, req)
    const url = new URL(breq.url)
    expect(url.pathname).to.eq("/proxy/thing")
  })
})