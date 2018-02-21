import { expect } from 'chai'
import { startServer } from './helper'
import axios from 'axios'

describe('Server', () => {
  describe('basic app', () => {
    before(async function () {
      this.server = await startServer('basic.js')
    })
    after(function (done) { this.server.close(done) })

    it('returns the correct response', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { 'Host': "test" } })
      expect(res.status).to.equal(200)
      expect(res.headers['custom-header']).to.equal("woot")
      expect(res.data).to.equal("hello test world /")
    })
  })

  describe('basic fetch app', () => {
    before(async function () {
      this.server = await startServer("basic-fetch.js")
    })
    after(function (done) { this.server.close(done) })

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.include(`<title>Example Domain</title>`)
      expect(res.headers['content-type']).to.equal('text/html')
    })
  })

  // same test as above, but reads fetch response into context
  describe('basic fetch and read app', () => {
    before(async function () {
      this.server = await startServer("basic-fetch-and-read.js")
    })
    after(function (done) { this.server.close(done) })

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.include(`<title>Example Domain</title>`)
      expect(res.headers['content-type']).to.equal('text/html')
    })
  })

  describe('basic transform app', () => {
    // before(async function () {
    //   this.server = await startServer("basic-transform.js")
    // })
    // after(function (done) { this.server.close(done) })

    it('transforms the content')
    // , async () => {
    //   let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
    //   expect(res.status).to.equal(200);
    //   expect(res.data).to.equal(`foo baz`)
    // })
  })

  describe('basic chain with google-analytics', () => {
    before(async function () {
      this.server = await startServer("basic-google-analytics.js")
    })
    after(function (done) { this.server.close(done) })

    it("doesn't bomb", async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
    })
  })

  // describe('dom selector', () => {
  //   before(async function () {
  //     this.server = await startServer("dom-selector.js")
  //   })
  //   after(function (done) { this.server.close(done) })

  //   it('selects the dom', async () => {
  //     let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
  //     expect(res.status).to.equal(200);
  //     expect(res.data).to.equal(`<span>empty-ish span</span><div id="woot2">nice2!</div>`);
  //   })
  // })

  // describe('dom streaming selector', () => {
  //   before(async function () {
  //     this.server = await startServer("streaming-dom-selector.js")
  //   })
  //   after(function (done) { this.server.close(done) })

  //   it('selects the dom', async () => {
  //     let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
  //     expect(res.status).to.equal(200);
  //     expect(res.data).to.equal(`Example Domain`);
  //   })
  // })

  describe('cookies', () => {
    before(async function () {
      this.server = await startServer("basic-cookies.js")
    })
    after(function (done) { this.server.close(done) })

    it('returns the cookie value', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test", cookie: 'foo=bar;hello=world;' } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal(`bar world`);
      expect(res.headers['set-cookie'][0]).to.equal(`hola=que%20tal; Max-Age=1000`)
    })
  })

  describe('fetch relative path', () => {
    before(async function () {
      this.server = await startServer("fetch-relative-path.js")
    })
    after(function (done) { this.server.close(done) })

    it('resolves relative paths to the original url properties', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar")
    })
  })

  describe('fetch absolute path', () => {
    before(async function () {
      this.server = await startServer("fetch-absolute-path.js")
    })
    after(function (done) { this.server.close(done) })

    it('resolves absolute paths with explicit port number', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar1")
    })
  })

  describe('fetch recursive', () => {
    before(async function () {
      this.server = await startServer("fetch-recursive.js")
    })
    after(function (done) { this.server.close(done) })

    it('returns an error', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(500)
      expect(res.data).to.equal("Too much recursion")
    })
  })

  describe('cache', () => {
    before(async function () {
      this.server = await startServer("cache.js")
    })
    after(function (done) { this.server.close(done) })

    it('adds and matches cache', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar")
    })
  })

  describe('can POST', () => {
    before(async function () {
      this.server = await startServer("basic-post.js")
    })
    after(function (done) { this.server.close(done) })

    it('posts body and all', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar")
    })
  })

  describe('set-cookie', () => {
    before(async function () {
      this.server = await startServer("set-cookie.js")
    })
    after(function (done) { this.server.close(done) })

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

  describe('log event', () => {
    before(async function () {
      this.server = await startServer("log.js")
    })
    after(function (done) { this.server.close(done) })

    it('received logs', async () => {
      let res = await axios.get("http://127.0.0.1:3333/")
      expect(res.status).to.equal(200);
      expect(res.data).to.deep.include.members([{ message: "hello world", level: 'info' }, { message: "debug world", level: "debug" }])
    })
  })

  describe('server header', () => {
    before(async function () {
      this.server = await startServer("basic.js")
    })
    after(function (done) { this.server.close(done) })

    it('replaces server header', async () => {
      let res = await axios.get("http://127.0.0.1:3333/")
      expect(res.status).to.equal(200)
      expect(res.headers['server']).include("fly")
    })
  })

  describe('cloning bodies', () => {
    before(async function () {
      this.server = await startServer("clone.js")
    })
    after(function (done) { this.server.close(done) })

    it('can clone both requests and responses', async () => {
      let res = await axios.post("http://127.0.0.1:3333/", "hello", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal(`res1: hellohello\nres2: hellohello`)
    })
  })
})