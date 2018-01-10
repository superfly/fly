// A proxy is a function that receives two arguments, a request object and a callback.
//
// If it can generate a respone, it calls callback with null and the response object.  Otherwise, either calls callback
// with no arguments, or with an error to stop the processing chain.
//
// The request consists of:
// url     - URL object
// method  - Request method (lower case)
// headers - Headers object (names are lower case)
// body    - Request body, an array of body part/encoding pairs
//
// The response consists of:
// version   - HTTP version
// status    - Status code
// headers   - Headers object (names are lower case)
// body      - Array of body parts
// trailers  - Trailers object (names are lower case)
//
// This file defines ProxyRequest, which acts as an HTTP ClientRequest that captures the request and passes it to the
// proxy chain, and ProxyResponse, which acts as an HTTP ClientResponse, playing back a response it received from the
// proxy.
//
// No actual proxies defined here.


const assert            = require('assert');
const { EventEmitter }  = require('events');
const HTTP              = require('http');
const HTTPS             = require('https');
const Stream            = require('stream');
const URL               = require('url');


// HTTP client request that captures the request and sends it down the processing chain.
module.exports = class ProxyRequest extends HTTP.IncomingMessage {

  constructor(options = {}, proxy) {
    super();
    this.proxy          = proxy;
    this.method         = (options.method || 'GET').toUpperCase();
    const protocol      = options.protocol || (options._defaultAgent && options._defaultAgent.protocol) || 'http:';
    const [host, port]  = (options.host || options.hostname).split(':');
    const realPort      = options.port || port || (protocol === 'https:' ? 443 : 80);
    this.url            = URL.parse(`${protocol}//${host || 'localhost'}:${realPort}${options.path || '/'}`, true);
    this.auth           = options.auth;
    this.agent          = options.agent || (protocol === 'https:' ? HTTPS.globalAgent : HTTP.globalAgent);
    this.cert           = options.cert;
    this.key            = options.key;
    this.headers        = {};
    if (options.headers)
      for (let name in options.headers) {
        let value = options.headers[name];
        if (value != null)
          this.headers[name.toLowerCase()] = value.toString();
      }
  }

  flushHeaders() {
  }

  setHeader(name, value) {
    assert(!this.ended, 'Already called end');
    assert(!this.body, 'Already wrote body parts');
    this.headers[name.toLowerCase()] = value;
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  removeHeader(name) {
    assert(!this.ended, 'Already called end');
    assert(!this.body, 'Already wrote body parts');
    delete this.headers[name.toLowerCase()];
  }

  addTrailers(trailers) {
    this.trailers = trailers;
  }

  setTimeout(timeout, callback) {
    if (callback)
      setImmediate(callback);
  }

  setNoDelay(/*nodelay = true*/) {
  }

  setSocketKeepAlive(/*enable = false, initial*/) {
  }

  write(chunk, encoding, callback) {
    assert(!this.ended, 'Already called end');
    this.body = this.body || [];
    this.body.push([chunk, encoding]);
    if (callback)
      setImmediate(callback);
  }

  end(data, encoding, callback) {
    assert(!this.ended, 'Already called end');

    if (typeof data === 'function')
      [ callback, data ] = [ data, null ];
    else if (typeof encoding === 'function')
      [ callback, encoding ] = [ encoding, null ];

    if (data) {
      this.body = this.body || [];
      this.body.push([ data, encoding ]);
    }
    this.ended = true;

    if (callback)
      setImmediate(callback);

    this.proxy(this, (error, captured)=> {
      // We're not asynchronous, but clients expect us to callback later on
      setImmediate(()=> {
        if (error)
          this.emit('error', error);
        else if (captured) {
          const response = new ProxyResponse(captured);
          this.emit('response', response);
        } else {
          const error = new Error(`${this.method} ${URL.format(this.url)} refused: not recording and no network access`);
          error.code  = 'ECONNREFUSED';
          error.errno = 'ECONNREFUSED';
          this.emit('error', error);
        }
      });
    });
  }

  flush() {
  }

  abort() {
  }

};


// HTTP client response that plays back a captured response.
class ProxyResponse extends Stream.Readable {

  constructor(captured) {
    super();
    this.once('end', ()=> {
      this.emit('close');
    });

    this.httpVersion      = captured.version || '1.1';
    this.httpVersionMajor = this.httpVersion.split('.')[0];
    this.httpVersionMinor = this.httpVersion.split('.')[1];
    this.statusCode       = parseInt(captured.statusCode || 200, 10);
    this.statusMessage    = captured.statusMessage || HTTP.STATUS_CODES[this.statusCode] || '';
    this.headers          = Object.assign({ }, captured.headers);
    this.rawHeaders       = (captured.rawHeaders || [].slice(0));
    this.trailers         = Object.assign({ }, captured.trailers);
    this.rawTrailers      = (captured.rawTrailers || []).slice(0);
    // Not a documented property, but request seems to use this to look for HTTP parsing errors
    this.connection       = new EventEmitter();
    this._body            = captured.body.slice(0);
    this.client           = { authorized: true }
  }

  _read() {
    const part = this._body.shift();
    if (part)
      this.push(part[0], part[1]);
    else
      this.push(null);
  }

  setTimeout(msec, callback) {
    if (callback)
      setImmediate(callback);
  }

  static notFound(url) {
    return new ProxyResponse({
      status: 404,
      body:   [ `No recorded request/response that matches ${URL.format(url)}` ]
    });
  }

}

