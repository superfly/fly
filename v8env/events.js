const logger = require('./logger')
const { EventEmitter2 } = require('eventemitter2')

const invalidResponseType = new Error(`Invalid response type for 'fetch' event. Expecting a straight Response, a function returning a Promise<Response> or a Response.`)

/**
 * The fetch event fires when your app receives an HTTP request
 * @event #fetch
 * @type {FetchEvent}
 * @property {FetchEvent} event
 */

/**
 * @class
 */
class FetchEvent {
	constructor(type, init, callback) {
		this.type = type
		this.request = init.request
		if (!this.request)
			throw new Error("init.request is required.")
		this.callback = callback
		this.respondWithEntered = false
	}

	/** 
	 * respondWith callback
	 * @callback respondWithCallback
	 * @param {Response} The HTTP response to reply with
	 */
	/**
	 * Registers a function to generate a response for this event
	 * @param {respondWithCallback} fn
	 */
	respondWith(fn) {
		this.respondWithEntered = true
		try {
			let ret = fn;
			if (typeof ret === "function") {
				ret = fn()
			}
			if (ret instanceof Promise) {
				ret.then((res) => {
					if (res instanceof Response)
						return this.callback(null, res)
					this.callback(invalidResponseType)
				}).catch((err) => {
					this.callback(err)
				})
			} else if (ret instanceof Response) {
				this.callback(null, fn)
			} else {
				this.callback(invalidResponseType)
			}
		} catch (err) {
			this.callback(err)
		}
	}
}

exports.FetchEvent = FetchEvent

const emitter = new EventEmitter2()

exports.addEventListener = function (name, fn) {
	emitter.addListener(name, fn)
}

exports.fireEventInit = function (ivm) {
	return function fireEvent(name, ...args) {
		args.unshift(ivm)
		try {
			switch (name) {
				case "fetch":
					fireFetchEvent.apply(undefined, args)
					break
				case "fetchEnd":
					fireFetchEndEvent.apply(undefined, args)
					break
				default:
					throw new Error(`unknown event listener: ${name}`)
			}
		} catch (err) {
			logger.debug(err.message, err.stack)
			let cb = args[args.length - 1] // should be the last arg
			if (cb instanceof ivm.Reference)
				cb.apply(undefined, [err.toString()])
		}
	}
}

function fireFetchEvent(ivm, url, nodeReq, reqProxy, nodeBody, callback) {
	logger.debug("handling request event")
	nodeReq.body = nodeBody
	let req = new Request(url, nodeReq, reqProxy)
	let fetchEvent = new FetchEvent('fetch', { request: req }, async function (err, res) {
		logger.debug("request event callback called", typeof err, typeof res, res instanceof Response)

		if (err)
			return callback.apply(null, [err.toString()])

		callback.apply(undefined, [null,
			new ivm.ExternalCopy({
				headers: res.headers,
				status: res.status,
				bodyUsed: res.bodyUsed,
			}).copyInto(),
			!res._proxy ?
				new ivm.ExternalCopy(await res.arrayBuffer()).copyInto() :
				null,
			res._proxy // pass back the proxy
		])
	})
	let fn = emitter.listeners('fetch').slice(-1)[0]
	if (typeof fn !== 'function')
		return callback.apply(null, ["No 'fetch' event listener attached."])

	fn(fetchEvent)
	if (!fetchEvent.respondWithEntered)
		return callback.apply(null, ["respondWith was not called for FetchEvent"])
}

function fireFetchEndEvent(ivm, url, nodeReq, nodeRes, err, done) {
	const listeners = emitter.listeners('fetchEnd')
	if (listeners.length === 0)
		return done.apply()
	const req = new Request(url, nodeReq)
	const res = new Response("", nodeRes)

	let event = {
		request: req,
		response: res,
		error: err
	}

	emitter.emitAsync('fetchEnd', event).then(() => {
		done.apply()
	})
}

class LogMessage {
	constructor(level, message, timestamp = new Date) {
		this.level = level
		this.message = message
		this.timestamp = timestamp
	}
}

class LogEvent {
	constructor(type = "log", init = {}) {
		this.type = type
		this.log = new LogMessage(init.level, init.message, init.timestamp || new Date)
	}
}

exports.LogEvent = LogEvent

exports.dispatchEvent = function dispatchEvent(event) {
	emitter.emit(event.type, event)
}