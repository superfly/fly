const { fireEventInit, addEventListener, dispatchEvent, FetchEvent } = require("./events")
const { Middleware, MiddlewareChain } = require("./middleware")
const { FlyBackend } = require("./fly-backend")
const { ReadableStream, WritableStream } = require('web-streams-polyfill')
const SessionStore = require('./session_store')

const { TextEncoder, TextDecoder } = require('text-encoding')

let internalTimers = {}

global.bootstrap = function bootstrap() {
	const ivm = global._ivm
	const dispatch = global._dispatch

	if (!ivm)
		throw new Error("isolated-vm as global _ivm is required")

	if (!dispatch)
		throw new Error("node function dispatcher as global _dispatch is required")

	// Cleanup, early!
	delete global._ivm
	delete global._dispatch
	delete global.bootstrap

	global.console = require('./console')(ivm)

	global.fly = {
		cache: require('./fly/cache')(ivm, dispatch)
	}

	global.setTimeout = (function (st, ivm) {
		return function (cb, ms) {
			const now = Date.now()
			st.apply(null, [new ivm.Reference(cb), ms])
				.then((t) => {
					internalTimers[now] = t
				})
			return now
		}
	})(global._setTimeout, ivm)
	delete global._setTimeout

	global.clearTimeout = (function (ct) {
		return function (timer) {
			if (internalTimers[timer])
				ct.apply(null, [internalTimers[timer]])
			return
		}
	})(global._clearTimeout)
	delete global._clearTimeout

	// Web primitives (?)
	global.ReadableStream = ReadableStream
	global.WritableStream = WritableStream
	global.TextEncoder = TextEncoder
	global.TextDecoder = TextDecoder

	// Web API
	global.URL = require('./url')
	global.fetch = require('./fetch')(ivm, dispatch)
	global.Body = require('./body')(ivm, dispatch)
	global.Headers = require('./headers')
	global.FormData = require('./formdata')(ivm, dispatch)
	global.Response = require('./response')(ivm, dispatch)
	global.Request = require('./request')(ivm, dispatch)

	// oh boy
	global.cache = require('./cache')(ivm, dispatch)
	global.session = new SessionStore()

	// Events
	global.fireEvent = fireEventInit(ivm, dispatch)
	global.addEventListener = addEventListener
	global.dispatchEvent = dispatchEvent

	global.FetchEvent = FetchEvent

	// DOM
	global.Document = require('./document')

	// Fly-specific
	global.FlyBackend = FlyBackend

	// Middleware
	global.Middleware = Middleware
	global.MiddlewareChain = MiddlewareChain
	// load all middleware
	const requireMw = require.context("./middleware", true, /\.js$/);
	requireMw.keys()
		.forEach((n) => {
			requireMw(n)(ivm, dispatch)
		});
}

global.middleware = {}

global.registerMiddleware = function registerMiddleware(type, fn) {
	global.middleware[type] = fn
}