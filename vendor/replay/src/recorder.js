const debug = require('./debug');
const passThrough = require('./pass_through');


module.exports = function recorded(settings) {
  const { catalog } = settings;
  const capture = passThrough(true);

  return function (request, callback) {
    let host = request.url.hostname;
    if (request.url.port && request.url.port !== '80')
      host = `${host}:${request.url.port}`;

    // Look for a matching response and replay it.
    try {
      const matchers = catalog.find(host);
      if (matchers)
        for (let matcher of matchers) {
          let response = matcher(request);
          if (response) {
            debug('matched!')
            callback(null, response);
            return;
          }
        }
    } catch (error) {
      error.code = 'CORRUPT FIXTURE';
      error.syscall = 'connect';
      callback(error);
      return;
    }

    // Do not record this host.
    if (settings.isDropped(request.url.hostname)) {
      const refused = new Error('Error: connect ECONNREFUSED');
      refused.code = refused.errno = 'ECONNREFUSED';
      refused.syscall = 'connect';
      callback(refused);
      return;
    }

    // In recording mode capture the response and store it.
    if (settings.mode === 'record') {
      capture(request, function (error, response) {
        if (error)
          callback(error);
        else {
          if (settings.recordResponseControl && settings.recordResponseControl[host])
            if (!settings.recordResponseControl[host](request, response)) {
              // don't save responses we don't like, eg. errors,
              callback(null, response);
              return;
            }
          catalog.save(host, request, response, function (saveError) {
            callback(saveError, response);
          });
        };
      });
      return;
    }

    // Not in recording mode, pass control to the next proxy.
    callback();
  };

};

