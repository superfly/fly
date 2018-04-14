import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'
import { readFileSync } from 'fs'

describe('fly.http', function () {
  before(startServer('font-test', { config: {} }))
  after(stopServer)

  it("matches a test font", async () => {
    let res = await axios.get("http://127.0.0.1:3333/", {})

    expect(res.data).to.equal(getComparativeData())
  })
})

function getComparativeData () {
  return readFileSync('fixtures/apps/font-test/compare.woff', 'binary')
}
