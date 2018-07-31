import CookieJar from './cookie_jar'
import Body from './ts/body_mixin'

function ushort(x) { return x & 0xFFFF; }

/**
 * Class representing a fetch response.
 * @param {Blob|String} [body]
 * @param {Object} [init]
 * @param {Number} [init.status]
 * @param {String} [init.statusText]
 * @param {String} [init.url]
 * @mixes Body
 */
export class Response extends Body {
	static redirect(url, status = 302) {
		return new Response('', {
			status,
			headers: {
				Location: url
			}
		})
	}
	constructor(body, init) {
		if (arguments.length < 1)
			body = '';

		super(body)

		init = Object(init) || {};

		/**
		 * @public
		 * @type {Headers}
		 */
		this.headers = new Headers(init.headers);

		// readonly attribute USVString url;
		/**
		 * @public
		 * @type {String}
		 * @readonly
		 */
		this.url = init.url || '';

		// readonly attribute unsigned short status;
		var status = 'status' in init ? ushort(init.status) : 200;
		if (status < 200 || status > 599) throw RangeError();

		/**
		 * @public
		 * @type {integer}
		 * @readonly
		 */
		this.status = status;

		// readonly attribute boolean ok;
		/**
		 * @public
		 * @type {boolean}
		 * @readonly
		 */
		this.ok = 200 <= this.status && this.status <= 299;

		// readonly attribute ByteString statusText;
		var statusText = 'statusText' in init ? String(init.statusText) : 'OK';
		if (/[^\x00-\xFF]/.test(statusText)) throw TypeError();

		/**
		 * @public
		 * @type {String}
		 * @readonly
		 */
		this.statusText = statusText;

		// readonly attribute Headers headers;
		// if ('headers' in init) fill(this.headers, init);

		// TODO: Implement these
		// readonly attribute ResponseType type;
		this.type = 'basic'; // TODO: ResponseType

		// Object.defineProperty(this, "body", {
		//   set: (value) => {
		//     Body.call(this, value)
		//   }
		// })
	}

	/**
	 * @public
	 * @type CookieJar
	 */
	get cookies() {
		if (this.cookieJar)
			return this.cookieJar
		this.cookieJar = new CookieJar(this)
		return this.cookieJar
	}

	clone() {
		if (this.bodyUsed)
			throw new Error("Body has already been used")
		let body2 = this.bodySource
		if (this.bodySource instanceof ReadableStream) {
			const tees = this.body.tee()
			this.stream = this.bodySource = tees[0]
			body2 = tees[1]
		}
		return new Response(body2, this)
	}
}
