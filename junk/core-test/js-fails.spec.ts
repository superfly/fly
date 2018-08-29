import { expect } from 'chai';
import { startServer, cacheStore, stopServer } from './helper'
import axios from 'axios'

describe('JS Fails', function () {
  describe('bad js syntax', function () {
    let fixtures = ["bad-syntax", "no-respondwith", "bad-respondwith", "no-fetch-listener", "not-a-response", "async-fetch-handler"];
    fixtures.forEach(f => {
      let bad = f
      describe(bad, function () {
        before(startServer(`fails/${bad}.js`))
        after(stopServer)

        it('returns an error', async () => {
          let res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })
          expect(res.status).to.equal(500)
        })
      })
    });
  })
  describe('races', function () {
    describe("setTimeout fires after response", function () {
      before(startServer(`fails/async-app`))
      before(function () {
        return cacheStore.set(this.server.runtime, "long-wait-after-response", "no")
      })
      after(stopServer)

      it('should write to cache after response', async function () {
        const cacheValue = Date.now().toString()
        const res = await axios.get("http://127.0.0.1:3333/", {
          headers: {
            'Host': "test",
            'X-Cache-Value': cacheValue
          }
        })
        expect(res.status).to.equal(200)
        expect(res.data).to.equal("hello")
        const sleep = function (ms: number) {
          return new Promise((resolve) => {
            setTimeout(() => { resolve() }, ms)
          })
        }

        await (sleep(150))

        let cached = await cacheStore.get(this.server.runtime, "long-wait-after-response")
        expect((<Buffer>cached).toString()).to.equal(cacheValue)
      })
    })
  })
})