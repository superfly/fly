import { expect } from 'chai'
import { createServer } from './helper'
import axios from 'axios'

describe('Server', () => {
  before(function (done) {
    createServer('./test/fixtures/apps/basic.js').then((server) => {
      this.server = server
      server.listen(3333, done)
    })
  })
  after(function (done) { this.server.close(done) })

  it('works', async () => {
    let res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })
    expect(res.status).to.equal(200)
    expect(res.headers['custom-header']).to.equal("woot")

    // expect((await fullRead(res)).toString()).to.equal("hello test world /")
    expect(res.data).to.equal("hello test world /")
  })
})