import { expect } from 'chai'
import { startServer, stopServer } from './helper'
import axios from 'axios'
import * as http from 'http'
import * as url from 'url'

import * as nock from 'nock'
import { createReadStream } from 'fs';

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

    before(() => {
      nock('https://example.com')
        .get('/')
        .replyWithFile(200, __dirname + "/fixtures/http/basic-fetch", {
          'Content-Type': 'text/html'
        });
    })

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

    before(() => {
      nock('https://example.com')
        .get('/')
        .replyWithFile(200, __dirname + "/fixtures/http/basic-fetch", {
          'Content-Type': 'text/html'
        });
    })

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.include(`<title>Example Domain</title>`)
      expect(res.headers['content-type']).to.equal('text/html')
    })
  })

  describe('basic fetch and read (slow)', function () {
    before(startServer('basic-fetch-and-read.js'))
    after(stopServer)

    before(() => {
      // this.timeout(5000)
      nock('https://example.com')
        .get('/')
        .delay({
          head: 500,
          body: 2000
        })
        .socketDelay(1000)
        .replyWithFile(200, __dirname + "/fixtures/http/fake.js", {
          'Content-Type': 'application/javascript'
        })
    })

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      // expect(res.data).to.include(`<title>Example Domain</title>`)
      // expect(res.headers['content-type']).to.equal('text/html')
    })
  })
  describe("fetch with timeout", function () {
    before(startServer('basic-fetch-and-read.js'))
    after(stopServer)

    before(() => {
      // this.timeout(5000)
      nock('https://example.com')
        .get('/')
        .delay({
          head: 500,
          body: 2000
        })
        .socketDelay(1000)
        .replyWithFile(200, __dirname + "/fixtures/http/fake.js", {
          'Content-Type': 'application/javascript'
        })
    })
    it('errors on timeout', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test", timeout: "100" } })
      expect(res.status).to.equal(502)
      expect(res.data).to.equal("timeout")
    })
  })

  describe('fetch read body after readTimeout', function () {
    before(startServer('fetch-read-timeout.js'))
    after(stopServer)

    before(() => {
      // this.timeout(5000)
      nock('https://example.com')
        .get('/')
        .reply(200, "hello")
    })

    it('may fetch responses externally', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("got an error")
    })
  })

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

  describe('fetch absolute path', function () {
    before(startServer("fetch-absolute-path.js"))
    after(stopServer)

    before(() => {
      nock('http://myserver.example:5000')
        .get('/foo1')
        .reply(200, "bar1");
    })

    it('resolves absolute paths with explicit port number', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar1")
    })
  })

  describe('fetch recursive', function () {
    before(startServer("fetch-recursive.js"))
    after(stopServer)

    it('returns an error w/o the header', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(400)
      expect(res.data).to.equal("Too much recursion")
    })

    it('returns fine with the header', async () => {
      let res = await axios.get("http://127.0.0.1:3333/wheader", { headers: { host: "test" } })
      expect(res.status).to.equal(200)
    })
  })

  describe('fetch relative path', function () {
    before(startServer("fetch-relative-path.js"))
    after(stopServer)

    it('bombs', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(500);
    })
  })

  describe('cache', function () {
    before(startServer("cache.js"))
    after(stopServer)

    before(() => {
      nock('http://cacheable/')
        .get('/foo')
        .reply(200, "bar", {
          date: 'Wed, 13 Dec 2017 21:32:50 GMT',
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=7234'
        });
    })

    it('adds and matches cache', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar")
    })
  })

  describe('can POST', function () {
    before(startServer("basic-post.js"))
    after(stopServer)

    before(() => {
      nock('https://example.com')
        .post('/')
        .reply(200, "bar");
    })

    it('posts body and all', async () => {
      let res = await axios.get("http://127.0.0.1:3333/", { headers: { host: "test" } })
      expect(res.status).to.equal(200);
      expect(res.data).to.equal("bar")
    })
  })

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

  describe("gzip", function () {
    describe("when not gzipped", () => {
      before(startServer("gzip.js"))
      after(stopServer)

      it('gzips if accepts encoding is right', function (done) {
        http.get(Object.assign({}, url.parse("http://127.0.0.1:3333/"), {
          method: "GET",
          headers: {
            "accept-encoding": "gzip"
          }
        }), function (res) {
          res.on("error", (err) => {
            console.log("ERROR GZIPIING", err)
            done(err)
          })
          expect(res.statusCode).to.equal(200)
          expect(res.headers['content-encoding']).to.equal('gzip')
          res.on('data', (chunk: Buffer) => {
            //expect(chunk.byteLength).to.equal(parseInt(<string>res.headers['content-length'], 10))
            expect(chunk.toString()).to.not.equal('notgzipped')
            done()
          })
        })
      })

      it('does not gzipped if image', function (done) {
        http.get(Object.assign({}, url.parse("http://127.0.0.1:3333/image.jpg"), {
          method: "GET",
        }), function (res) {
          res.on("error", done)
          expect(res.statusCode).to.equal(200)
          expect(res.headers['content-type']).to.equal("image/jpg")
          expect(res.headers['content-encoding']).to.be.undefined
          res.on('data', (chunk: Buffer) => {
            expect(chunk.toString()).to.equal('pretend-image')
            done()
          })
        })
      })
      it('does not gzip if not accepted', function (done) {
        http.get(Object.assign({}, url.parse("http://127.0.0.1:3333/"), {
          method: "GET",
        }), function (res) {
          res.on("error", done)
          expect(res.statusCode).to.equal(200)
          expect(res.headers['content-encoding']).to.be.undefined
          res.on('data', (chunk: Buffer) => {
            expect(chunk.toString()).to.equal('notgzipped')
            done()
          })
        })
      })
    })

    describe('pre-gzipped', function () {
      before(startServer("pregzip.js"))
      after(stopServer)

      it('does not re-gzip', function (done) {
        http.get(Object.assign({}, url.parse("http://127.0.0.1:3333/"), {
          method: "GET",
        }), function (res) {
          res.on("error", done)
          expect(res.statusCode).to.equal(200)
          expect(res.headers['content-encoding']).to.equal('gzip')
          res.on('data', (chunk: Buffer) => {
            expect(chunk.toString()).to.equal('gzipped')
            done()
          })
        })
      })
    })
  })

  describe("big fetch responses", function () {
    before(startServer("twenty-mb.js"))
    after(stopServer)

    before(() => {
      nock('http://ipv4.download.thinkbroadband.com')
        .get('/20MB.zip')
        .reply(200, createReadStream(__dirname + "/fixtures/http/20mb"));
    })

    it('works', async function () {
      this.timeout(30000) // give it some leeway
      let res = await axios.post("http://127.0.0.1:3333/", "hello", { headers: { host: "test" } })
      expect(res.status).to.equal(200)
    })
  })
})