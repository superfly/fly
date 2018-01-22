const { ReadableStream } = require('web-streams-polyfill')

const bodyUsedError = new Error("Body already used, try using tee() on the stream to output to multiple destinations")
const unsupportedBodyTypeError = new Error("Body type is unsupported, please use a ReadableStream or a string")
/**
 * This provides methods for handling body streams. It's not meant to be used directly.
 * @name Body
 * @mixin
 */
module.exports = function (ivm) {
	return function Body(_stream) {
		console.debug("calling body!", typeof _stream)
		this.bodyUsed = false;

		Object.defineProperty(this, "_stream", {
			enumerable: false,
			value: _stream,
			writable: true
		})

		Object.defineProperty(this, "body", {
			enumerable: false,
			get: function () {
				if (this.bodyUsed)
					throw bodyUsedError
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
			console.debug("body text() called")
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
			console.debug("body arrayBuffer() called")
			const arr = await bufferFromStream(this.body.getReader())
			this.bodyUsed = true
			return arr.buffer
		}

	}

	function makeStream(_stream) {
		if (_stream instanceof ReadableStream) {
			return _stream
		}
		if (!_stream) {
			return emptyStream()
		}
		if (_stream instanceof ivm.Reference) {
			return streamFromNode(_stream)
		}
		if (typeof _stream === "string") {
			console.debug("body is a string")
			return streamFromString(_stream)
		}
		if (_stream instanceof FormData) {
			return streamFromString(_stream.toString())
		}
		console.debug("make stream", typeof _stream, _stream.toString())
		throw unsupportedBodyTypeError
	}

	function bufferFromStream(stream) {
		return new Promise((resolve, reject) => {
			let parts = [];
			let encoder = new TextEncoder();
			// recurse
			(function pump() {
				console.debug("pumping!")
				stream.read()
					.then(({ done, value }) => {
						if (done) {
							console.debug("done!", typeof parts[0], parts[0] instanceof Uint8Array)
							return resolve(concatenate(Uint8Array, ...parts))
						}

						if (typeof value === "string") {
							console.debug("was a string")
							parts.push(encoder.encode(value))
						} else if (value instanceof ArrayBuffer) {
							console.debug("was array buffer")
							parts.push(new Uint8Array(value))
						}

						return pump();
					})
					.catch((err) => {
						console.debug("error pumping", err.toString())
						reject(err)
					});
			})()
		})
	}

	function streamFromNode(fn) {
		let closed = false
		return new ReadableStream({
			start(controller) {
				fn.apply(undefined, [new ivm.Reference((name, ...args) => {
					console.debug("got an event in streamFromNode", name)
					if ((name === "close" || name === "end") && !closed) {
						controller.close()
						closed = true
					} else if (name === "error") {
						controller.error(new Error(args[0]))
					} else if (name === "data") {
						console.debug("got data!")
						controller.enqueue(args[0])
					} else
						console.debug("unhandled event", name)
				})])
			},
			cancel() {
				console.debug("readable stream was cancelled")
			},
			pull() {
				console.debug("readable stream pull called, not doing anything.")
			}
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