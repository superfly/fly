// Patch DNS.lookup to resolve all hosts added via Replay.localhost as 127.0.0.1

const DNS    = require('dns');
const Replay = require('./');


const originalLookup = DNS.lookup;
DNS.lookup = function(domain, options, callback) {
  if (typeof domain === 'string' && typeof options === 'object' &&
      typeof callback === 'function' && Replay.isLocalhost(domain)) {
    const family = options.family || 4;
    const ip = (family === 6) ? '::1' : '127.0.0.1';
    callback(null, ip, family);
  } else
    originalLookup(domain, options, callback);
};

