const {  setup, HTTP_PORT, HTTPS_PORT, INACTIVE_PORT, CORRUPT_PORT } = require('./helpers');
const assert  = require('assert');
const File    = require('fs');
const HTTP    = require('http');
const HTTPS   = require('https');
const Async   = require('async');
const Request = require('request');
const Replay  = require('../src');


// Test replaying results from fixtures in spec/fixtures.
describe('Replay', function() {


  // Send responses to non-existent server on inactive port, expect replayed responses from fixtures.
  describe('matching URL', function() {

    before(function() {
      Replay.mode = 'replay';
    });

    describe('listeners', function() {
      let response;

      before(function(done) {
        HTTP
          .get(`http://example.com:${INACTIVE_PORT}/weather?c=94606`, function(_) {
            response = _;
            done();
          })
          .on('error', done);
      });

      it('should return HTTP version', function() {
        assert.equal(response.httpVersion, '1.1');
      });
      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
      it('should return response headers', function() {
        assert.deepEqual(response.headers, {
          'content-type': 'text/html',
          'date':         'Tue, 29 Nov 2011 03:12:15 GMT'
        });
      });
      it('should return response trailers', function() {
        assert.deepEqual(response.trailers, { });
      });
    });

    describe('Old http status line format', function() {
      let response;

      before(function(done) {
        HTTP
          .get(`http://example.com:${INACTIVE_PORT}/weather?c=94606&statusLineFormat=old`, function(_) {
            response = _;
            done();
          })
          .on('error', done);
      });

      it('should return HTTP version', function() {
        assert.equal(response.httpVersion, '1.1');
      });
      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
      it('should return response headers', function() {
        assert.deepEqual(response.headers, {
          'content-type': 'text/html',
          'date':         'Tue, 29 Nov 2011 03:12:15 GMT'
        });
      });
      it('should return response trailers', function() {
        assert.deepEqual(response.trailers, { });
      });
    });


    describe('callback', function() {
      let response;

      before(function(done) {
        HTTP.get({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          path:     '/weather?c=94606'
        }, function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        })
        .on('error', done);
      });

      it('should return HTTP version', function() {
        assert.equal(response.httpVersion, '1.1');
      });
      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
      it('should return response headers', function() {
        assert.deepEqual(response.headers, {
          'content-type': 'text/html',
          'date':         'Tue, 29 Nov 2011 03:12:15 GMT'
        });
      });
      it('should return response trailers', function() {
        assert.deepEqual(response.trailers, { });
      });
    });
  });


  describe('matching on query strings', function() {
    let response1;
    let response2;

    before(function(done) {
      HTTP.get({ hostname: 'example.com', port: INACTIVE_PORT, path: '/query?param=1' })
        .on('response', function(_) {
          response1 = _;
          response1.body = '';
          response1.on('data', function(chunk) {
            response1.body += chunk;
          });
          response1.on('end', done);
        })
        .on('error', done);
    });

    before(function(done) {
      HTTP.get({ hostname: 'example.com', port: INACTIVE_PORT, path: '/query?param=2' })
        .on('response', function(_) {
          response2 = _;
          response2.body = '';
          response2.on('data', function(chunk) {
            response2.body += chunk;
          });
          response2.on('end', done);
        })
        .on('error', done);
    });

    it('should select the correct fixture', function() {
      // HTTP body contains tailing line feeds, use trim to get rid of them
      assert.equal(response1.body.trim(), '1');
      assert.equal(response2.body.trim(), '2');
    });
  });


  describe('matching an https url', function() {
    let response;

    before(function() {
      Replay.mode = 'replay';
    });

    before(function(done) {
      HTTPS.get({ hostname: 'example.com', port: HTTPS_PORT, path: '/minimal' })
        .on('response', function(_) {
          response = _;
          done();
        })
        .on('error', done);
    });

    it('should return HTTP version', function() {
      assert.equal(response.httpVersion, '1.1');
    });
    it('should return status code', function() {
      assert.equal(response.statusCode, 200);
    });
  });


  describe('matching a regexp', function() {
    let response;

    before(function() {
      Replay.mode = 'replay';
    });

    before(function(done) {
      HTTP.get({ hostname: 'example.com', port: INACTIVE_PORT, method: 'get', path: '/regexp' })
        .on('response', function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        })
        .on('error', done);
    });

    it('should match the right fixture', function() {
      assert.equal(response.body.trim(), 'regexp');
    });
  });


  describe('matching a regexp url with flags', function() {
    let response;

    before(function() {
      Replay.mode = 'replay';
    });

    before(function(done) {
      HTTP.get({ hostname: 'example.com', port: INACTIVE_PORT, method: 'get', path: '/aregexp2' })
        .on('response', function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        })
        .on('error', done);
    });

    it('should match a fixture', function() {
      assert.equal(response.body.trim(), 'Aregexp2');
    });
  });


  describe('matching when changing fixtures dir', function() {
    before(function() {
      Replay.mode = 'replay';
    });

    describe('original catalog', function() {
      let response;

      before(function(done) {
        HTTP.get({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          path:     '/weather?c=94606'
        }, function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        })
        .on('error', done);
      });

      it('should match to response in original catalog', function() {
        assert.equal(response.headers.date, 'Tue, 29 Nov 2011 03:12:15 GMT');
        assert.equal(response.body, 'Nice and warm\n');
      });

    });

    describe('alternative catalog', function() {
      let response;

      before(function() {
        Replay.fixtures = `${__dirname}/fixtures/other-fixtures-dir`;
      });

      before(function(done) {
        HTTP.get({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          path:     '/weather?c=94606'
        }, function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        })
        .on('error', done);
      });

      it('should match to response in original catalog', function() {
        assert.equal(response.headers.date, 'Tue, 30 Nov 2011 03:12:15 GMT');
        assert.equal(response.body, 'Sweet and cold\n');
      });

      after(function() {
        Replay.fixtures = `${__dirname}/fixtures`;
      });
    });

  });


  describe('recording query parameters', function() {
    const fixturesDir = `${__dirname}/fixtures/127.0.0.1-${HTTP_PORT}`;

    before(setup);

    before(function() {
      Replay.mode = 'record';
      Replay.reset('127.0.0.1');
    });

    it('should create a fixture per unique URL path', function(done) {
      const requests = [
        { name: 'Lorem', extra: 'Ipsum'},
        { name: 'Dolor', extra: 'Sit'}
      ].map(function(query) {
        return function(callback) {
          Request.get({
            url:    `http://127.0.0.1:${HTTP_PORT}/query`,
            qs:     query,
            json:   true
          }, function(error, response, body) {
            if (error)
              callback(error);
            else
              try {
                assert.deepEqual(body, query);
                callback(null, query);
              } catch (error) {
                callback(error);
              }
          });
        };
      });

      Async.series(requests, function(error) {
        if (error)
          done(error);
        else {
          // fixtures should be written now
          Replay.mode = 'replay';
          Async.series(requests, done);
        }
      });
    });

    after(function() {
      for(let file of File.readdirSync(fixturesDir))
        File.unlinkSync(`${fixturesDir}/${file}`);
      File.rmdirSync(fixturesDir);
    });

  });


  describe('recording gzipped replay', function() {
    const fixturesDir = `${__dirname}/fixtures/127.0.0.1-${HTTP_PORT}`;

    before(setup);

    before(function() {
      Replay.mode = 'record';
      Replay.reset('127.0.0.1');
    });

    it('should create unzipped fixture for gzipped reply', function(done) {
      const query = { name: 'Amet', extra: 'consectetur'};
      const request = function(callback) {
        Request.get({
          url:    `http://127.0.0.1:${HTTP_PORT}/query`,
          qs:     query,
          headers: {
            'accept-encoding': 'gzip'
          },
          json:   true
        }, function(error, response, body) {
          if (error)
            callback(error);
          else
            try {
              assert.deepEqual(body, query);
              callback(null, query);
            } catch (error) {
              callback(error);
            }
        });
      };

      request(function(error) {
        if (error)
          done(error);
        else {
          // fixtures should be written now
          Replay.mode = 'replay';
          request(done);
        }
      });
    });

    after(function() {
      for(let file of File.readdirSync(fixturesDir))
        File.unlinkSync(`${fixturesDir}/${file}`);
      File.rmdirSync(fixturesDir);
    });

  });


  describe('recording multiple of the same header', function() {
    const fixturesDir = `${__dirname}/fixtures/127.0.0.1-${HTTP_PORT}`;

    before(setup);

    before(function() {
      Replay.mode = 'record';
      Replay.reset('127.0.0.1');
    });

    before(function(done) {
      HTTP.get({ hostname: '127.0.0.1', port: HTTP_PORT, path: '/set-cookie' })
        .on('response', function(response) {
          response.on('end', done);
        })
        .on('error', done);
    });

    it('should create a fixture with multiple set-cookie headers', function() {
      let setCookieCount = 0;
      const files   = File.readdirSync(fixturesDir);
      const fixture = File.readFileSync(`${fixturesDir}/${files[0]}`, 'utf8');
      for (let line of fixture.split('\n'))
        if (/set-cookie: c\d=v\d/.test(line))
          setCookieCount++;
      assert.equal(setCookieCount, 2);
    });


    describe('replaying multiple headers', function() {
      let headers;

      before(function(done) {
        Request.get(`http://127.0.0.1:${HTTP_PORT}/set-cookie`, function(error, resp) {
          headers = resp.headers;
          done(error);
        });
      });

      it('should have both set-cookie headers', function() {
        assert.equal(headers['set-cookie'][0], 'c1=v1; Path=/');
        assert.equal(headers['set-cookie'][1], 'c2=v2; Path=/');
      });
    });


    after(function() {
      for (let file of File.readdirSync(fixturesDir))
        File.unlinkSync(`${fixturesDir}/${file}`);
      File.rmdirSync(fixturesDir);
    });
  });


  describe('recording POST data', function() {

    const fixturesDir = `${__dirname}/fixtures/127.0.0.1-${HTTP_PORT}`;

    function setupPostRequest(done) {
      const request = HTTP.request({
        hostname: '127.0.0.1',
        port:     HTTP_PORT,
        method:   'post',
        path:     '/post-data'
      }, function(response) {
        response.on('end', done);
      });
      request.write('request data');
      request.end();
    }

    function hasSavedPostRequestData() {
      if (File.existsSync(fixturesDir)) {
        let hasData   = false;
        const files   = File.readdirSync(fixturesDir);
        const fixture = File.readFileSync(`${fixturesDir}/${files[0]}`, 'utf8');
        for (let line of fixture.split('\n'))
          if (line === 'body: request data')
            hasData = true;
        return hasData;
      }
    }

    before(setup);

    before(function() {
      Replay.mode = 'record';
      Replay.reset('127.0.0.1');
    });

    context('without record response control', function() {
      before(setupPostRequest);

      it('should save POST request data', function() {
        assert(hasSavedPostRequestData());
      });
    });

    describe('with record response control', function() {
      context('that indicates response should be recorded', function() {
        before(function() {
          Replay.recordResponseControl = {
            ['127.0.0.1:' + HTTP_PORT] : function() {
              return true;
            }
          };
        });

        before(setupPostRequest);

        it('should save POST request data', function() {
          assert(hasSavedPostRequestData());
        });
      });
      context('that indicates response should not be recorded', function() {
        before(function() {
          Replay.recordResponseControl = {
            ['127.0.0.1:' + HTTP_PORT] : function() {
              return false;
            }
          };
        });

        before(setupPostRequest);

        it('should not save POST request data', function() {
          assert(!hasSavedPostRequestData());
        });
      });

      after(function() {
        Replay.recordResponseControl = null;
      });
    });



    afterEach(function() {
      if (File.existsSync(fixturesDir)) {
        for (let file of File.readdirSync(fixturesDir))
          File.unlinkSync(`${fixturesDir}/${file}`);
        File.rmdirSync(fixturesDir);
      }
    });
  });


  describe('recording multi-line POST data', function() {
    const fixturesDir = `${__dirname}/fixtures/127.0.0.1-${HTTP_PORT}`;

    before(setup);

    before(function() {
      Replay.mode = 'record';
      Replay.reset('127.0.0.1');
    });

    before(function(done) {
      const request = HTTP.request({
        hostname: '127.0.0.1',
        port:     HTTP_PORT,
        method:   'post',
        path: '/post-data'
      }, function(response) {
        response.on('end', done);
      });
      request.write('line1\nline2\nline3');
      request.end();
    });

    it('should save POST request data', function() {
      const files   = File.readdirSync(fixturesDir);
      const fixture = File.readFileSync(`${fixturesDir}/${files[0]}`, 'utf8');
      assert.equal(fixture.split('\n')[1], 'body: line1\\nline2\\nline3');
    });

    after(function() {
      for (let file of File.readdirSync(fixturesDir))
        File.unlinkSync(`${fixturesDir}/${file}`);
      File.rmdirSync(fixturesDir);
    });
  });


  describe('replaying with POST body', function() {
    before(function() {
      Replay.mode = 'replay';
    });

    describe('matching', function() {
      let response;

      before(function(done) {
        const request = HTTP.request({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          method:   'post',
          path:     '/post-body'
        }, function(_) {
          response = _;
          response.on('end', done);
        })
        .on('error', done);
        request.write('request body');
        request.end();
      });

      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
    });

  });


  describe('replaying with multi-line POST body', function() {
    let response;

    before(function() {
      Replay.mode = 'replay';
    });

    describe('matching', function() {
      before(function(done) {
        const request = HTTP.request({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          method:   'post',
          path:     '/post-body-multi'
        }, function(_) {
          response = _;
          response.on('end', done);
        })
        .on('error', done);
        request.write('line1\nline2\nline3');
        request.end();
      });

      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
    });
  });


  describe('replaying with POST body regular expression', function() {
    before(function() {
      Replay.mode = 'replay';
    });

    describe('matching', function() {
      let response;

      before(function(done) {
        const request = HTTP.request({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          method:   'post',
          path:     '/post-body-regexp'
        }, function(_) {
          response = _;
          response.on('end', done);
        })
        .on('error', done);
        request.write('request body 17');
        request.end();
      });

      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
    });

    describe('not matching', function() {
      let error;

      before(function(done) {
        const request = HTTP.request({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          method:   'post',
          path:     '/post-body-regexp'
        }, function(_) {
          response = _;
          response.on('end', done);
        })
        .on('error', function(_) {
          error = _;
          done();
        });
        request.write('request body ABC');
        request.end();
      });

      it('should callback with error', function() {
        assert(error instanceof Error);
        assert.equal(error.code, 'ECONNREFUSED');
      });
    });

  });


  describe('only specified headers', function() {
    const fixturesDir = `${__dirname}/fixtures/127.0.0.1-${HTTP_PORT}`;

    before(setup);

    before(function() {
      Replay.mode = 'record';
      Replay.reset('127.0.0.1');
      // Drop the /accept/ header
      Replay.headers = Replay.headers.filter(header => !header.test('accept'));
    });

    before(function(done) {
      HTTP.get({ hostname: '127.0.0.1', port: HTTP_PORT, path: '/', headers: { accept: 'application/json' } })
        .on('response', function(response) {
          response.on('end', done);
        })
        .on('error', done);
    });

    it('should not store the accept header', function() {
      const files   = File.readdirSync(fixturesDir);
      const fixture = File.readFileSync(`${fixturesDir}/${files[0]}`, 'utf8');
      assert(!/accept/.test(fixture));
    });

    after(function() {
      for (let file of File.readdirSync(fixturesDir))
        File.unlinkSync(`${fixturesDir}/${file}`);
      File.rmdirSync(fixturesDir);
    });
  });



  // Send responses to non-existent server on inactive port. No matching fixture for that path, expect a 404.
  describe('undefined path', function() {
    let error;

    before(function() {
      Replay.mode = 'replay';
    });

    before(function(done) {
      HTTP.get({ hostname: 'example.com', port: INACTIVE_PORT, path: '/weather?c=14003' })
        .on('response', done)
        .on('error', function(_) {
          error = _;
          done();
        });
    });

    it('should callback with error', function() {
      assert(error instanceof Error);
      assert.equal(error.code, 'ECONNREFUSED');
    });
  });


  // Send responses to non-existent server on inactive port. No matching fixture for that host, expect refused connection.
  describe('undefined host', function() {
    let error;

    before(function() {
      Replay.mode = 'default';
    });

    before(function(done) {
      HTTP.get({ hostname: 'no-such', port: INACTIVE_PORT })
        .on('response', done)
        .on('error', function(_) {
          error = _;
          done();
        });
    });

    it('should callback with error', function() {
      assert(error instanceof Error);
      assert.equal(error.code, 'ECONNREFUSED');
    });
  });


  // Mapping specifies a header, make sure we only match requests that have that header value.
  describe('header', function() {
    before(function() {
      Replay.mode = 'replay';
    });

    describe('matching', function() {
      let statusCode;

      before(function(done) {
        const request = HTTP.request({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          path: '/weather.json'
        });
        request.setHeader('Accept', 'application/json');
        request.on('response', function(response) {
          statusCode = response.statusCode;
          response.on('end', done);
        });
        request.on('error', done);
        request.end();
      });

      it('should return status code', function() {
        assert.equal(statusCode, 200);
      });
    });

    describe('no match', function() {
      let error;

      before(function(done) {
        const request = HTTP.request({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          path:     '/weather.json'
        });
        request.setHeader('Accept', 'text/html');
        request.on('response', function(response) {
          response.on('end', done);
        });
        request.on('error', function(_) {
          error = _;
          done();
        });
        request.end();
      });

      it('should fail to connnect', function() {
        assert(error instanceof Error);
      });
    });

  });


  describe('method', function() {
    before(function() {
      Replay.mode = 'replay';
    });

    describe('matching', function() {
      let statusCode, headers;

      before(function(done) {
        const request = HTTP.request({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          method:   'post',
          path:     '/posts'
        });
        request.setHeader('Accept', 'application/json');
        request.on('response', function(response) {
          statusCode = response.statusCode;
          headers    = response.headers;
          response.on('end', done);
        });
        request.on('error', done);
        request.end();
      });

      it('should return status code', function() {
        assert.equal(statusCode, 201);
      });
      it('should return headers', function() {
        assert.equal(headers.location, '/posts/1');
      });
    });

    describe('no match', function() {
      let error;

      before(function(done) {
        const request = HTTP.request({
          hostname: 'example.com',
          port:     INACTIVE_PORT,
          method:   'put',
          path:     '/posts'
        });
        request.setHeader('Accept', 'application/json');
        request.on('response', function(response) {
          response.on('end', done);
        });
        request.on('error', function(_) {
          error = _;
          done();
        });
        request.end();
      });

      it('should fail to connnect', function() {
        assert(error instanceof Error);
      });
    });

  });


  describe('corrupt replay file', function() {
    let error;

    before(function() {
      Replay.mode = 'default';
    });

    before(function(done) {
      HTTP.get({ hostname: 'example.com', port: CORRUPT_PORT, path: '/minimal' })
        .on('response', done)
        .on('error', function(_) {
          error = _;
          done();
        });
    });

    it('should callback with error', function() {
      assert(error instanceof Error);
      assert.equal(error.code, 'CORRUPT FIXTURE');
    });
  });


  describe('minimal response', function() {
    before(function() {
      Replay.mode = 'replay';
    });

    describe('listeners', function() {
      let response;

      before(function(done) {
        HTTP.get({ hostname: 'example.com', port: INACTIVE_PORT, path: '/minimal' })
          .on('response', function(_) {
            response = _;
            response.body = '';
            response.on('data', function(chunk) {
              response.body = response.body + chunk;
            });
            response.on('end', done);
            response.on('error', done);
          })
          .on('error', done);
      });

      it('should return HTTP version', function() {
        assert.equal(response.httpVersion, '1.1');
      });
      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
      it('should return no response headers', function() {
        assert.deepEqual(response.headers, { });
      });
      it('should return no response trailers', function() {
        assert.deepEqual(response.trailers, { });
      });
      it('should return no response body', function() {
        assert.equal(response.body, '');
      });
    });

  });

});

