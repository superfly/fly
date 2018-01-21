import { expect } from 'chai'
import { startServer } from './helper'
import axios from 'axios'

describe('fly-backend', () => {
  before(async function () {
    this.server = await startServer('fly-backend')
    this.backendServer = await startServer('echo-server.js', {port: 3334})
  })
  after(function (done) {
    Promise.all([this.server.close(), this.backendServer.close()]).then(()=> done())
  })

  it('sets host,x-forwarded-* headers', async () => {
    let res = await axios.get("http://127.0.0.1:3333/foo1", {
      headers: { 'Host': "test" },
      maxRedirects: 0
    })
    expect(res.status).to.equal(200)
    const headers:any = { "x-forwarded-proto": "http", "x-forwarded-for": "::ffff:127.0.0.1"}

    expect(res.data.headers['host']).to.equal("test")
    Object.keys(headers).forEach((k) => {
      expect(res.data.headers[k]).instanceOf(Array, k)
      expect(res.data.headers[k]).include(headers[k], k)
    })
  })
})
