import { expect } from 'chai'

import * as proxy from '@fly/proxy'

const origin = "https://fly.io/proxy/"
const req = new Request("https://wat.com/path/to/thing", { headers: { "host": "notwat.com" } })
describe("proxy", () => {
  it('includes host header and base path properly', () => {
    const breq = proxy.buildProxyRequest(origin, {}, req)
    const url = new URL(breq.url)
    expect(breq.headers.get("host")).to.eq("fly.io")
    expect(url.pathname).to.eq("/proxy/path/to/thing")
  })

  it('includes host header from request when forwardHostHeader', () => {
    const breq = proxy.buildProxyRequest(origin, { forwardHostHeader: true }, req)
    const url = new URL(breq.url)
    expect(breq.headers.get("host")).to.eq("notwat.com")
    expect(url.pathname).to.eq("/proxy/path/to/thing")
  })

  it('rewrite paths properly', () => {
    const breq = proxy.buildProxyRequest(origin, { stripPath: "/path/to/" }, req)
    const url = new URL(breq.url)
    expect(url.pathname).to.eq("/proxy/thing")
  })
})