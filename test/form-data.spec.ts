import { expect } from 'chai'
import { startServer } from './helper'
import axios from 'axios'

describe('form-data', () => {
  before(async function() {
    this.server = await startServer('form-data.js')
  })
  after(function(done) { this.server.close(done) })

  it('modifies query params before going upstream', async () => {
    let res = await axios.post("http://127.0.0.1:3333/wat", {
      headers: { 'Host': 'test' },
      maxRedirects: 0
    })
    expect(res.status).to.equal(200)
    expect(res.data).to.equal('foo=bar')
  })
})
