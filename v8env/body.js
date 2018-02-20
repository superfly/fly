import { ReadableStream } from 'web-streams-polyfill'
import { logger } from './logger'

export const bodyUsedError = new Error("Body already used, try using tee() on the stream to output to multiple destinations")
const unsupportedBodyTypeError = new Error("Body type is unsupported, please use a ReadableStream, ArrayBuffer or a string")
/**
 * This provides methods for handling body streams. It's not meant to be used directly.
 * @name Body
 * @mixin
 */
export default function bodyInit(ivm, dispatch) {
	function _read(ref){
		let closed = false
		return new ReadableStream({
			start(controller) {
				dispatch.apply(null, [
					"readProxyStream",
					ref,
					new ivm.Reference((name, ...args) => {
						if (name === "close" || name === "end") {
							if (!closed) {
								closed = true
								controller.close()
							}
						} else if (name === "error") {
							controller.error(new Error(args[0]))
						} else if (name === "data") {
							controller.enqueue(args[0])
						} else
							logger.debug("unhandled event", name)
					})
				])	
			},
			cancel() {
				logger.debug("readable stream was cancelled")
			}
		})
	}
	return function Body(_stream) {
		this.bodyUsed = false;

		Object.defineProperty(this, "_stream", {
			enumerable: false,
			value: _stream,
			writable: true
		})

		Object.defineProperty(this, "body", {
			enumerable: false,
			get: function () {
				return makeStream(this._stream)
			}
		})

		// this.formData =() => {
		//   checkBodyUsed(this)
		//   if (this._stream instanceof FormData)
		//     return Promise.resolve(this._stream)
		//   if (this._body instanceof FormData)
		//     return Promise.resolve(this._body)
		//   if (!(this._proxy instanceof ivm.Reference))
		//     return Promise.reject(new Error("can only get form data from native requests"))
		//   return new Promise((resolve, reject) => {
		//     FormData.parse(this._proxy).then((fd) => {
		//       this._body = fd
		//       resolve(fd)
		//     }).catch((err) => {
		//       reject(err)
		//     })
		//   })
		// }


		/**
		 * Buffers and returns body text (be careful on huge bodies)
		 * @function
		 * @returns {string} The body as a string
		 * @memberof Body
		 */
		this.text = async () => {
			if (this.bodyUsed)
				throw bodyUsedError
			const arr = await bufferFromStream(this.body.getReader())
			const text = new TextDecoder('utf-8').decode(arr)
			return text
		}

		/**
		 * Buffers and returns the body
		 * @returns {Uint8Array} Raw body data
		 * @function
		 * @memberof Body
		 */
		this.arrayBuffer = async () => {
			if (this.bodyUsed)
				throw bodyUsedError
			const arr = await bufferFromStream(this.body.getReader())
			this.bodyUsed = true
			return arr.buffer
		}

	}

	function makeStream(_stream) {
		if (!_stream) {
			return emptyStream()
		}
		if (_stream instanceof ReadableStream) {
			return _stream
		}
		if (_stream instanceof ArrayBuffer) {
			return streamFromString(_stream)
		}
		if (_stream instanceof ivm.Reference) {
			return _read(_stream)
		}
		if (typeof _stream === "string") {
			return streamFromString(_stream)
		}
		if (_stream instanceof FormData) {
			return streamFromString(_stream.toString())
		}
		logger.debug("make stream", typeof _stream, _stream.toString())
		throw unsupportedBodyTypeError
	}

	function bufferFromStream(stream) {
		return new Promise((resolve, reject) => {
			let parts = [];
			let encoder = new TextEncoder();
			// recurse
			(function pump() {
				stream.read()
					.then(({ done, value }) => {
						if (done) {
							return resolve(concatenate(Uint8Array, ...parts))
						}

						if (typeof value === "string") {
							parts.push(encoder.encode(value))
						} else if (value instanceof ArrayBuffer) {
							parts.push(new Uint8Array(value))
						} else {
							logger.error("unhandled type on stream read")
						}

						return pump();
					})
					.catch((err) => {
						logger.debug("error pumping", err.toString())
						reject(err)
					});
			})()
		})
	}

	function streamFromString(str) {
		return new ReadableStream({
			start(controller) {
				controller.enqueue(str)
				controller.close()
			},
			cancel() { },
			pull() { }
		})
	}

	function emptyStream() {
		return new ReadableStream({
			start(controller) {
				controller.close()
			}
		})
	}
}


function concatenate(resultConstructor, ...arrays) {
	const totalLength = arrays.reduce((total, arr) => {
		return total + arr.length
	}, 0);
	const result = new resultConstructor(totalLength);
	arrays.reduce((offset, arr) => {
		result.set(arr, offset);
		return offset + arr.length;
	}, 0);
	return result;
}