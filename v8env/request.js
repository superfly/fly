const CookieJar = require('./cookie_jar')

module.exports = function (ivm) {
	function byteUpperCase(s) {
		return String(s)
			.replace(/[a-z]/g, function (c) {
				return c.toUpperCase();
			});
	}

	function normalizeMethod(m) {
		var u = byteUpperCase(m);
		if (u === 'DELETE' || u === 'GET' || u === 'HEAD' || u === 'OPTIONS' ||
			u === 'POST' || u === 'PUT') return u;
		return m;
	}

	/**
	 * An HTTP request
	 * @param {Blob|String} [body]
	 * @param {Object} [init]
	 * @mixes Body
	 */
	class Request {
		constructor(input, init) {
			if (arguments.length < 1) throw TypeError('Not enough arguments');

			if (arguments[2] instanceof ivm.Reference) //proxied
				this._proxy = arguments[2]

			// console.debug('creating request! body typeof:', typeof Body, typeof init.body)
			Body.call(this, null);

			// readonly attribute ByteString method;
			/**
			 * The HTTP request method
			 * @readonly
			 * @default GET
			 * @type {string}
			 */
			this.method = 'GET';

			// readonly attribute USVString url;
			/**
			 * The request URL
			 * @readonly
			 * @type {string}
			 */
			this.url = '';

			// readonly attribute DOMString referrer;
			this.referrer = null; // TODO: Implement.

			// readonly attribute RequestMode mode;
			this.mode = null; // TODO: Implement.

			// readonly attribute RequestCredentials credentials;
			this.credentials = 'omit';

			if (input instanceof Request) {
				if (input.bodyUsed) throw TypeError();
				input.bodyUsed = true;
				this.method = input.method;
				this.url = input.url;
				this.headers = new Headers(input.headers);
				this.headers._guard = input.headers._guard;
				this.credentials = input.credentials;
				this._stream = input._stream;
			} else {
				// input = USVString(input);
				this.url = input //String(new URL(input, self.location));
			}

			init = Object(init);

			if ('remoteAddr' in init)
				this.remoteAddr = init.remoteAddr

			if ('method' in init) {
				this.method = normalizeMethod(init.method)
			}

			if ('headers' in init) {
				/**
				 * Headers sent with the request.
				 * @type {Headers}
				 */
				this.headers = new Headers(init.headers);
			}

			if ('body' in init) {
				console.debug("setting le body for request", typeof init.body, init.body instanceof FormData)
				this._stream = init.body;
			}

			if ('credentials' in init &&
				(['omit', 'same-origin', 'include'].indexOf(init.credentials) !== -1))
				this.credentials = init.credentials;
		}

		get cookies() {
			if (this.cookieJar)
				return this.cookieJar
			this.cookieJar = new CookieJar(this)
			return this.cookieJar
		}
	}

	return Request
}
