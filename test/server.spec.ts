import { expect } from 'chai'
import { startServer } from './helper'
import axios from 'axios'

describe('Server', () => {
  describe('basic app', () => {
    before(async function () {
      this.server = await startServer('basic.js')
    })
    after(function (done) { this.server.close(done) })

    it('returns the correct response', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })
      expect(res.status).to.equal(200)
      expect(res.headers['custom-header']).to.equal("woot")
      expect(res.data).to.equal("hello test world /")
    })
  })

  describe('basic fetch app', () => {
    before(async function () {
      this.server = await startServer("basic-fetch.js")
    })
    after(function (done) { this.server.close(done) })

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.include(`<title>Example Domain</title>`)
      expect(res.headers['content-type']).to.equal('text/html')
    })
  })
})