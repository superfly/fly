import { expect } from 'chai'
import { startServer, stopServer, makeServer } from './helper'
import axios from 'axios'

describe('fly-backend', function () {
  before(startServer('fly-backend'))
  before(function (done) {
    this.backendServer = makeServer('echo-server.js')
    this.backendServer.listen(3334, done)
  })
  after(stopServer)
  after(function (done) {
    this.backendServer.close(done)
  })

  it('sets host,x-forwarded-* headers', async () => {
    let res = await axios.get("http://127.0.0.1:3333/foo1", {
      headers: { 'Host': "test" },
      maxRedirects: 0
    })
    expect(res.status).to.equal(200)
    const headers: any = { "x-forwarded-proto": "http", "x-forwarded-for": "::ffff:127.0.0.1" }

    expect(res.data.headers['host']).to.equal("test")
    Object.keys(headers).forEach((k) => {
      expect(res.data.headers[k]).instanceOf(Array, k)
      expect(res.data.headers[k]).to.include(headers[k], k)
    })
  })

  it('passes querystring through', async () => {
    let res = await axios.get("http://127.0.0.1:3333/querystring?node=isdeadtome.com", {
      headers: { 'Host': "test" }
    })

    expect(res.status).to.equal(200)
    expect(res.data.url).to.include("querystring?node=isdeadtome.com")
  })
})
