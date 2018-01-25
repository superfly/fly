import { expect } from 'chai';
import { startServer } from './helper'
import axios from 'axios'

describe('JS Fails', () => {
  describe('bad js syntax', () => {
    let fixtures = ["bad-syntax", "not-async", "void-returns"];
    fixtures.forEach(f => {
      let bad = f
      describe(bad, () => {
        before(async function () {
          this.server = await startServer(`fails/${bad}.js`)
        })
        after(function (done) { this.server.close(done) })

        it('returns an error', async () => {
          let res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })
          expect(res.status).to.equal(500)
        })
      })
    });
  })
})