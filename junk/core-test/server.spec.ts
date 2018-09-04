import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'
import * as http from 'http'
import * as url from 'url'

import * as nock from 'nock'
import { createReadStream } from 'fs';

describe('Server', function () {

  // describe('basic chain with google-analytics', function () {
  //   before(startServer("basic-google-analytics.js"))
  //   after(stopServer)

  //   it("doesn't bomb", async () => {
  //     let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test", 'user-agent': 'predictable-agent' } })
  //     expect(res.status).to.equal(200);
  //   })
  // })

  describe('dom selector', function () {
    before(startServer("dom-selector.js"))
    after(stopServer)

    it('selects the dom', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal(`<span>empty-ish span</span><div id="woot2">nice2!</div>`);
    })
  })

  // describe('dom streaming selector', function() {
  //   before(
  //     startServer("streaming-dom-selector.js")
  //   })
  //   after(stopServer)

  //   it('selects the dom', async () => {
  //     let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
  //     expect(res.status).to.equal(200);
  //     expect(res.data).to.equal(`Example Domain`);
  //   })
  // })


  describe('set-cookie', function () {
    before(startServer("set-cookie.js"))
    after(stopServer)

    before(() => {
      nock('http://test')
        .get('/set-cookies')
        .reply(200, "ok", {
          'set-cookie': [
            'fly_cid=f93f9d40-41b7-4d57-a245-6f639d402585; Expires=Wed, 16 Dec 2037 18:16:57 GMT; HttpOnly',
            'foo=bar',
            '_some_session=2342353454edge56rtyghf'
          ]
        });
    })

    it('does not merge headers', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("ok")

      expect(res.headers['set-cookie']).to.deep.equal([
        "fly_cid=f93f9d40-41b7-4d57-a245-6f639d402585; Expires=Wed, 16 Dec 2037 18:16:57 GMT; HttpOnly",
        "foo=bar",
        "_some_session=2342353454edge56rtyghf"
      ])
    })
  })
})