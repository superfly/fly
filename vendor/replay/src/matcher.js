// A matcher is a function that, given a request, returns an appropriate response or nothing.
//
// The most common use case is to calling `Matcher.fromMapping(mapping)`.
//
// The request consists of:
// url     - URL object
// method  - Request method (lower case)
// headers - Headers object (names are lower case)
// body    - Request body (for some requests)
//
// The response consists of:
// version   - HTTP version
// status    - Status code
// headers   - Headers object (names are lower case)
// body      - Array of body parts
// trailers  - Trailers object (names are lower case)


const assert         = require('assert');
const URL            = require('url');
const jsStringEscape = require('js-string-escape');

// Simple implementation of a matcher.
//
// To create a matcher from request/response mapping use `fromMapping`.
module.exports = class Matcher {

  constructor(request, response) {
    // Map requests to object properties.  We do this for quick matching.
    assert(request.url || request.regexp, 'I need at least a URL to match request to response');
    if (request.regexp) {
      this.hostname = request.hostname;
      this.regexp   = request.regexp;
    } else {
      const url = URL.parse(request.url);
      this.hostname = url.hostname;
      this.port     = url.port;
      this.path     = url.path;
    }

    this.method   = (request.method && request.method.toUpperCase()) || 'GET';
    this.headers  = {};
    if (request.headers)
      for (let name in request.headers) {
        let value = request.headers[name];
        this.headers[name.toLowerCase()] = value;
      }
    this.body = request.body;

    // Create a normalized response object that we return.
    this.response = {
      version:        response.version || '1.1',
      statusCode:     response.statusCode && parseInt(response.statusCode, 10) || 200,
      statusMessage:  response.statusMessage || '',
      headers:        {},
      body:           response.body ? response.body.slice(0) : [],
      trailers:       {}
    };

    // Copy over header to response, downcase header names.
    if (response.headers) {
      const headers = this.response.headers;
      for (let name in response.headers) {
        let value = response.headers[name];
        headers[name.toLowerCase()] = value;
      }
    }
    // Copy over trailers to response, downcase trailers names.
    if (response.trailers) {
      const trailers = this.response.trailers;
      for (let name in response.trailers) {
        let value = response.trailers[name];
        trailers[name.toLowerCase()] = value;
      }
    }
  }


  // Quick and effective matching.
  match(request) {
    const { url, method, headers, body } = request;
    if (this.hostname && this.hostname !== url.hostname)
      return false;
    if (this.regexp) {
      if (!this.regexp.test(url.path))
        return false;
    } else {
      if (this.port && this.port !== url.port)
        return false;
      if (this.path && this.path !== url.path)
        return false;
    }
    if (this.method !== method)
      return false;

    for (let name in this.headers)
      if (this.headers[name] !== headers[name])
        return false;

    if (body) {
      let data = '';
      for (let chunks of body)
        data += chunks[0];
      data = jsStringEscape(data);
      if (this.body && this.body !== data)
        return false;
    }
    return true;
  }


  // Returns new matcher function based on the supplied mapping.
  //
  // Mapping can contain `request` and `response` object.  As shortcut, mapping can specify `path` and `method` (optional)
  // directly, and also any of the response properties.
  static fromMapping(host, mapping) {
    assert(!!mapping.path ^ !!mapping.request, 'Mapping must specify path or request object');

    let matchingRequest;
    if (mapping.path)
      matchingRequest = {
        url:    URL.resolve(`http://${host}/`, mapping.path),
        method: mapping.method
      };
    else if (mapping.request.url instanceof RegExp)
      matchingRequest = {
        host:     host,
        regexp:   mapping.request.url,
        method:   mapping.request.method,
        headers:  mapping.request.headers,
        body:     mapping.request.body
      };
    else
      matchingRequest = {
        url:      URL.resolve(`http://${host}`, mapping.request.url),
        method:   mapping.request.method,
        headers:  mapping.request.headers,
        body:     mapping.request.body
      };

    const matcher = new Matcher(matchingRequest, mapping.response || {});
    return function(request) {
      if (matcher.match(request))
        return matcher.response;
    };
  }

};

