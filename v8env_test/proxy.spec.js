import { expect } from 'chai'

import * as proxy from '@fly/proxy'

const origin = "https://fly.io/proxy/"
const req = new Request("https://wat.com/path/to/thing", { headers: { "host": "wat.com" } })

describe("proxy", () => {
  it('includes host header and base path properly', () => {
    const breq = proxy.buildProxyRequest(origin, {}, req)
    const url = new URL(breq.url)
    expect(breq.headers.get("host")).to.eq("fly.io")
    expect(url.hostname).to.eq("fly.io")
    expect(url.pathname).to.eq("/proxy/path/to/thing")
  })

  it('includes explicit host header if different than origin', () => {
    const breq = proxy.buildProxyRequest(origin, { headers: { "host": "wut.com" } }, req)
    const url = new URL(breq.url)
    expect(breq.headers.get("host")).to.eq("wut.com")
    expect(url.hostname).to.eq("fly.io")
    expect(url.pathname).to.eq("/proxy/path/to/thing")
  })

  it('rewrite paths properly', () => {
    const breq = proxy.buildProxyRequest(origin, { stripPath: "/path/to/" }, req)
    const url = new URL(breq.url)
    expect(url.pathname).to.eq("/proxy/thing")
  })
})
