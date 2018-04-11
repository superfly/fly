import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'

describe('Server', function () {
  describe('basic app', function () {
    before(startServer('basic.js'))
    after(stopServer)

    it('returns the correct response', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })
      expect(res.status).to.equal(200)
      expect(res.headers['custom-header']).to.equal("woot")
      expect(res.data).to.equal("hello test world /")
    })
  })

  describe('basic fetch app', function () {
    before(startServer('basic-fetch.js'))
    after(stopServer)

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.include(`<title>Example Domain</title>`)
      expect(res.headers['content-type']).to.equal('text/html')
    })
  })

  // same test as above, but reads fetch response into context
  describe('basic fetch and read app', function () {
    before(startServer('basic-fetch-and-read.js'))
    after(stopServer)

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.include(`<title>Example Domain</title>`)
      expect(res.headers['content-type']).to.equal('text/html')
    })
  })

  describe('basic gzip fetch and read app', function () {
    before(startServer('gzip-fetch.js'))
    after(stopServer)

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.include(`<title>Example Domain</title>`)
      expect(res.headers['content-type']).to.equal('text/html')
    })
  })

  describe('basic chain with google-analytics', function () {
    before(startServer("basic-google-analytics.js"))
    after(stopServer)

    it("doesn't bomb", async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test", 'user-agent': 'predictable-agent' } })
      expect(res.status).to.equal(200);
    })
  })

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

  describe('cookies', function () {
    before(startServer("basic-cookies.js"))
    after(stopServer)

    it('returns the cookie value', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test", cookie: 'foo=bar;hello=world;' } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal(`bar world`);
      expect(res.headers['set-cookie'][0]).to.equal(`hola=que%20tal; Max-Age=1000`)
    })
  })

  describe('fetch relative path', function () {
    before(startServer("fetch-relative-path.js"))
    after(stopServer)

    it('resolves relative paths to the original url properties', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar")
    })
  })

  describe('fetch absolute path', function () {
    before(startServer("fetch-absolute-path.js"))
    after(stopServer)

    it('resolves absolute paths with explicit port number', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar1")
    })
  })

  describe('fetch recursive', function () {
    before(startServer("fetch-recursive.js"))
    after(stopServer)

    it('returns an error', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(500)
      expect(res.data).to.equal("Too much recursion")
    })
  })

  describe('cache', function () {
    before(startServer("cache.js"))
    after(stopServer)

    it('adds and matches cache', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar")
    })
  })

  describe('can POST', function () {
    before(startServer("basic-post.js"))
    after(stopServer)

    it('posts body and all', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar")
    })
  })

  describe('set-cookie', function () {
    before(startServer("set-cookie.js"))
    after(stopServer)

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

  describe('cloning bodies', function () {
    before(startServer("clone.js"))
    after(stopServer)

    it('can clone both requests and responses', async () => {
      let res = await axios.post("http://127.0.0.1:3333/", "hello", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal(`res1: hellohello\nres2: hellohello`)
    })
  })

  describe("fetch file://", function () {
    before(startServer("files"))
    after(stopServer)

    it('works', async function () {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200)
      expect(res.data).to.equal("foo bar")
    })
  })

  describe("big fetch responses", function () {
    before(startServer("twenty-mb.js"))
    after(stopServer)

    it('works', async function () {
      this.timeout(30000) // give it some leeway
      let res = await axios.post("http://127.0.0.1:3333/", "hello", { headers: { host: "test" } })
      expect(res.status).to.equal(200)
    })
  })
})
