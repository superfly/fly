import { expect } from 'chai'
import { startServer } from './helper'
import axios from 'axios'
import { stringify } from 'querystring'


describe('form-data', function () {
  before(startServer('form-data.js'))
  after(function (done) { this.server.close(done) })

  it('modifies query params before going upstream', async () => {
    const params = stringify({
      param1: 'value1',
      param2: ['value2', 'value3']
    })
    let res = await axios.post("http://127.0.0.1:3333/wat", params, {
      headers: { 'Host': 'test' },
      maxRedirects: 0
    })
    expect(res.status).to.equal(200)
    expect(res.data).to.equal('param1=value1&param2=value2&param2=value3&foo=bar')
  })
})
