import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'

describe('Static Files', function () {
  before(startServer('static-files'))
  after(stopServer)

  it('fetches dummy text', async () => {
    let res = await axios.get("http://127.0.0.1:3333/public/dummy.txt", { headers: { host: "test" } })

    expect(res.status).to.equal(200)
    expect(res.data).to.equal("foo bar")
  })
})
