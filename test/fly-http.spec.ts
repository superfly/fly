import { expect } from 'chai'
import { startServer } from './helper'
import axios from 'axios'

describe('fly.http', () => {
  before(async function () {
    this.server = await startServer('fly-routes', { config: {} })
  })
  after(function (done) { this.server.close(done) })

  it("matches a defined route", async () => {
    let res = await axios.get("http://127.0.0.1:3333/", {
      headers: { 'Host': "test" }
    })

    expect(res.data).to.equal("/")
  })
  it("matches a respondWith", async () => {
    let res = await axios.get("http://127.0.0.1:333/wat", {
      headers: { 'Host': "test" }
    })

    expect(res.data).to.equal("default")
  })
})