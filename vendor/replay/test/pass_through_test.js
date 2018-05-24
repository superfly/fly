const { setup, HTTP_PORT, HTTPS_PORT } = require('./helpers');
const assert  = require('assert');
const HTTP    = require('http');
const HTTPS   = require('https');
const Replay  = require('../src');



// First batch is testing requests that pass through to the server, no recording/replay.
//
// Second batch is testing requests with no replay and no network access.
describe('Pass through', function() {

  before(setup);

  before(function() {
    Replay.localhost('pass-through');
  });


  // Send request to the live server and check the responses.
  describe('bloody', function() {
    before(function() {
      Replay.mode = 'bloody';
    });

    describe('listeners', function() {
      let response = null;

      before(function(done) {
        const request = HTTP.get({ hostname: 'pass-through', port: HTTP_PORT });
        request.on('response', function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        });
        request.on('error', done);
      });

      it('should return HTTP version', function() {
        assert.equal(response.httpVersion, '1.1');
      });
      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
      it('should return response trailers', function() {
        assert.deepEqual(response.trailers, { });
      });
      it('should return response headers', function() {
        assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
      });
      it('should return response body', function() {
        assert.deepEqual(response.body, 'Success!');
      });
    });

    describe('callback', function() {
      let response = null;

      before(function(done) {
        const request = HTTP.get({ hostname: 'pass-through', port: HTTP_PORT }, function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        });
        request.on('error', done);
      });

      it('should return HTTP version', function() {
        assert.equal(response.httpVersion, '1.1');
      });
      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
      it('should return response headers', function() {
        assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
      });
      it('should return response trailers', function() {
        assert.deepEqual(response.trailers, { });
      });
      it('should return response body', function() {
        assert.deepEqual(response.body, 'Success!');
      });
    });

    after(function() {
      Replay.mode = 'replay';
    });
  });


  describe('ssl', function() {
    let response = null;

    before(function() {
      // Make sure we're using passThrough and not just passing request s
      // through HTTP.request
      Replay.mode = 'bloody';
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    });


    describe('get', function() {
      before(function(done) {
        const options = {
          method:             'GET',
          hostname:           'pass-through',
          port:               HTTPS_PORT,
          agent:              false,
          rejectUnauthorized: false
        };
        const request = HTTPS.request(options, function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        });
        request.on('error', done);
        request.end();
      });

      it('should return HTTP version', function() {
        assert.equal(response.httpVersion, '1.1');
      });
      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
      it('should return response headers', function() {
        assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
      });
      it('should return response trailers', function() {
        assert.deepEqual(response.trailers, { });
      });
      it('should return response body', function() {
        assert.deepEqual(response.body, 'Success!');
      });
    });

    describe('post', function() {
      before(function(done) {
        const body = new Buffer('foo=bar');
        const options = {
          method:             'POST',
          hostname:           'pass-through',
          port:               HTTPS_PORT,
          agent:              false,
          path:               '/post-echo',
          headers: {
            'content-type':   'application/x-www-form-urlencoded',
            'content-length': body.length
          },
          rejectUnauthorized: false
        };
        const request = HTTPS.request(options, function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        });
        request.write(body);
        request.on('error', done);
        request.end();
      });

      it('should return status code', function() {
        assert.equal(response.statusCode, 200);
      });
      it('should post the body', function() {
        assert.equal(response.body, JSON.stringify({ foo: 'bar' }));
      });
    });

    after(function() {
      Replay.mode = 'replay';
    });
  });


  // Send request to the live server, but this time network connection disabled.
  describe('replay', function() {
    before(function() {
      Replay.mode = 'replay';
      Replay.reset('pass-through');
    });

    describe('listeners', function() {
      let error = null;

      before(function(done) {
        const request = HTTP.get({ hostname: 'pass-through', port: HTTP_PORT });
        request.on('error', function(_) {
          error = _;
          done();
        });
      });

      it('should callback with error', function() {
        assert(error instanceof Error);
        assert.equal(error.code, 'ECONNREFUSED');
      });
    });

    describe('localhost', function() {
      let response = null;

      before(function(done) {
        const request = HTTP.get({ hostname: 'localhost', port: HTTP_PORT }, function(_) {
          response = _;
          response.body = '';
          response.on('data', function(chunk) {
            response.body += chunk;
          });
          response.on('end', done);
        });
        request.on('error', done);
      });

      it('should pass through by default', function() {
        assert.equal(response.statusCode, 200);
      });
    });
  });

});

