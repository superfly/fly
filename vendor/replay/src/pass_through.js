const HTTP = require('http');
const Zlib = require('zlib');

const ClientRequest = HTTP.ClientRequest;

module.exports = function passThrough(passThroughFunction) {
  if (arguments.length === 0)
    passThroughFunction = ()=> true;
  else if (typeof passThrough === 'string') {
    const hostname = passThroughFunction;
    passThroughFunction = (request)=> request.hostname === hostname;
  } else if (typeof passThroughFunction !== 'function') {
    const truthy = !!passThroughFunction;
    passThroughFunction = ()=> truthy;
  }

  return function(request, callback) {
    if (passThroughFunction(request)) {
      const options = {
        protocol: request.url.protocol,
        hostname: request.url.hostname,
        port:     request.url.port,
        path:     request.url.path,
        method:   request.method,
        headers:  request.headers,
        agent:    request.agent,
        auth:     request.auth,
        key:      request.key,
        cert:     request.cert
      };

      const http = new ClientRequest(options);
      if (request.trailers)
        http.addTrailers(request.trailers);
      http.on('error', callback);
      http.on('response', function(response) {
        const captured = {
          version:        response.httpVersion,
          statusCode:     response.statusCode,
          statusMessage:  response.statusMessage,
          rawHeaders:     response.rawHeaders,
          headers:        Object.assign({}, response.headers),
          body:           []
        };
        if (['gzip', 'deflate'].indexOf(captured.headers['content-encoding']) !== -1) {
          const unzip = Zlib.createUnzip();
          unzip.trailers = response.trailers;
          unzip.rawTrailers = response.rawTrailers;
          response = response.pipe(unzip);
          delete captured.headers['content-encoding'];
        }
        response.on('data', function(chunk, encoding) {
          captured.body.push([chunk, encoding]);
        });
        response.on('end', function() {
          captured.trailers     = response.trailers;
          captured.rawTrailers  = response.rawTrailers;
          callback(null, captured);
        });
      });

      if (request.body)
        for (let part of request.body)
          http.write(part[0], part[1]);
      http.end();
    } else
      callback();
  };
};

