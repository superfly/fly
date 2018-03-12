import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'

describe('force-ssl', function () {
  before(startServer('force-ssl.js'))
  after(stopServer)

  it('redirects an http url to https', async () => {
    let res = await axios.get("http://127.0.0.1:3333/wat", {
      headers: { 'Host': 'test' },
      maxRedirects: 0
    })
    expect(res.status).to.equal(308)
    expect(res.headers['location']).to.equal("https://test/wat")
  })

  it('does not redirect an https request', async () => {
    let res = await axios.get("http://127.0.0.1:3333/wat", {
      headers: { 'Host': 'test', 'X-Forwarded-Proto': 'https' },
      maxRedirects: 0
    })
    expect(res.status).to.equal(200)
  })
})
