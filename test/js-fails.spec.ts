import { expect } from 'chai';
import { startServer, cacheStore } from './helper'
import axios from 'axios'

describe('JS Fails', () => {
  describe('bad js syntax', () => {
    let fixtures = ["bad-syntax", "not-async", "void-returns", "no-respondwith", "no-fetch-listener", "not-a-response", "async-fetch-handler"];
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
  describe('races', ()=>{
    describe("setTimeout fires after response", ()=>{
      before(async function () {
        await cacheStore.set("cache:test-app-id:long-wait-after-response", "no")
        this.server = await startServer(`fails/async-app`)
      })
      after(function (done) { this.server.close(done) })

      it('should write to cache after response', async () => {
        const cacheValue = Date.now().toString()
        const res = await axios.get("http://127.0.0.1:3333/", { 
          headers: { 
            'Host': "test", 
            'X-Cache-Value': cacheValue
          }
        })
        expect(res.status).to.equal(200)
        expect(res.data).to.equal("hello")
        const sleep = function(ms:number){
          return new Promise((resolve)=>{
            setTimeout(()=>{ resolve() }, ms)
          })
        }

        await(sleep(500))

        let cached = await cacheStore.get("cache:test-app-id:long-wait-after-response")
        expect((<Buffer>cached).toString()).to.equal(cacheValue)
      })
    })
  })
})