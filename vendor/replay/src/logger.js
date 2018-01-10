// Request handler that logs all request to the console when DEBUG=reply

const debug = require('./debug');
const URL   = require('url');


module.exports = function logger() {
  return function(request, callback) {
    debug(`Requesting ${request.method} ${URL.format(request.url)}`);
    request.on('response', function(response) {
      debug(`Received ${response.statusCode} ${URL.format(request.url)}`);
    });
    request.on('error', function(error) {
      debug(`Error ${error}`);
    });
    callback();
  };
};

