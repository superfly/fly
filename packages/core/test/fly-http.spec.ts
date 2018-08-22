import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'

describe('fly.http', function () {
  before(startServer('fly-http.js', { config: {} }))
  after(stopServer)

  it("matches a respondWith", async () => {
    let res = await axios.get("http://127.0.0.1:3333/wat", {
      headers: { 'Host': "test" }
    })

    expect(res.data).to.equal("default")
  })
})