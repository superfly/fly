import { expect } from 'chai'
import { startServer } from './helper'
import axios from 'axios'

describe('fly-routes', () => {
  describe('with no rules', () => {
    before(async function () {
      this.server = await startServer('fly-routes', { appConfig: {} })
    })
    after(function (done) { this.server.close(done) })

    it('returns 404', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })
      expect(res.status).to.equal(404)
    })
  })

  describe('with rules', () => {
    before(async function () {
      this.server = await startServer('fly-routes')
    })
    after(function (done) { this.server.close(done) })

    it('matches a redirect rule with absolute url rewrite', async () => {
      let res = await axios.get("http://127.0.0.1:3333/github", {
        headers: { 'Host': "test" },
        maxRedirects: 0
      })
      expect(res.status).to.equal(302)
      expect(res.headers['location']).to.equal('https://github.com/superfly/nodeproxy')
    })

    it('matches a redirect rule with relative url rewrite', async () => {
      let res = await axios.get("http://127.0.0.1:3333/something/awful/poop", {
        headers: { 'Host': "test" },
        maxRedirects: 0
      })
      expect(res.status).to.equal(302)
      expect(res.headers['location']).to.equal('/poop')
    })

    it('matches a rewrite rule', async () => {
      let res = await axios.get("http://127.0.0.1:3333/foo1", {
        headers: { 'Host': "test" },
        maxRedirects: 0
      })
      expect(res.status).to.equal(200)
      //expect(res.data).to.equal('bar1')
    })

    it('matches a hostname', async () => {
      let res = await axios.get("http://127.0.0.1:3333/bar1", {
        headers: {'Host': "test8"},
        maxRedirects: 0
      })
      expect(res.status).to.equal(302)
      expect(res.headers['location']).to.equal('http://www.test.com/bar1')
    })
  })
})
