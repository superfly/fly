import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'
import * as nock from 'nock'

/**
 * GIANT HACK WARNING
 * 
 * This test will probably start failing when the client cert in ./fixtures/apps/fetch-with-cert/ 
 * expirtes.
 */
describe('bridge#fetch', function () {
  describe('tls', function () {
    before(startServer('fetch-with-cert'))
    after(stopServer)

    before(() => {
      nock.enableNetConnect();
    })
    after(() => {
      nock.disableNetConnect();
    })

    it('sends client cert', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.include(`<title>Example Domain</title>`)
      expect(res.headers['content-type']).to.equal('text/html')
    })

    it('fails without client cert', async () => {
      let res = await axios.get("http://127.0.0.1:3333/no/", { headers: { host: "test" } })

      expect(res.status).to.not.equal(200);
    })
  })
})