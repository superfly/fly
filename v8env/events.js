const { Buffer } = require('buffer')
const logger = require('./logger')

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
		try {
			if (typeof fn === "function") {
				let ret = fn.call(null)
				if (ret instanceof Promise) {
					ret.then(res => {
						this.callback(null, res)
					}).catch(err => {
						this.callback(err)
					})
				} else if (ret instanceof Response) {
					this.callback(null, ret)
				}
			} else if (fn instanceof Response) {
				this.callback(null, fn)
			}
		} catch (err) {
			this.callback(err)
		}
	}
}

exports.FetchEvent = FetchEvent

let eventListeners = {}

exports.addEventListener = function (name, fn) {
	eventListeners[name] || (eventListeners[name] = [])
	eventListeners[name].push(fn)
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
				case "responseChunk":
					fireResponseChunkEvent.apply(undefined, args)
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

	async function fireResponseChunkEvent(ivm, chunk, done) {
		logger.debug("fire response chunk!")
		if (!eventListeners["responseChunk"] || eventListeners["responseChunk"].length == 0)
			return done.apply(null, [null, new ivm.ExternalCopy(chunk)
				.copyInto()])
		let newChunk = chunk instanceof ArrayBuffer ?
			Buffer.from(chunk) :
			Buffer.from(chunk, 'utf8')
		for (let fn of eventListeners["responseChunk"]) {
			// logger.debug("going to apply to fn:", fn.toString())
			let ret = fn.apply(null, [{
				chunk: newChunk,
				rewrite: function (newNewChunk) {
					newChunk = newNewChunk
				}
			}])
			if (ret instanceof Promise)
				await ret
		}
		logger.debug("applying new chunk")
		done.apply(null, [null, new ivm.ExternalCopy(newChunk)
			.copyInto()])
	}
}

function fireFetchEvent(ivm, url, nodeReq, reqProxy, nodeBody, callback) {
	logger.debug("handling request event")
	nodeReq.body = nodeBody
	let req = new Request(url, nodeReq, reqProxy)
	let fetchEvent = new FetchEvent('fetch', { request: req }, async function (err, res) {
		logger.debug("request event callback called", typeof err, typeof res, res instanceof Response)
		callback.apply(undefined, [
			err && err.toString() || null,
			new ivm.ExternalCopy({
				headers: res.headers,
				status: res.status,
				bodyUsed: res.bodyUsed,
			})
				.copyInto(),
			!res._proxy ?
				new ivm.ExternalCopy(await res.arrayBuffer())
					.copyInto() :
				null,
			res._proxy // pass back the proxy
		])
	})
	for (let fn of eventListeners["fetch"]) {
		try {
			fn.apply(null, [fetchEvent])
		} catch (err) {
			logger.debug("error in fetch!", err.toString())
		}
	}
}

function fireFetchEndEvent(ivm, url, nodeReq, nodeRes, err, done) {
	if (!eventListeners["fetchEnd"] || eventListeners["fetchEnd"].length == 0)
		return done.apply()
	const req = new Request(url, nodeReq)
	const res = new Response("", nodeRes)
	let event = {
		request: req,
		response: res,
		error: err
	}

	let promises = []

	for (let fn of eventListeners["fetchEnd"])
		promises.push(fn.call(null, event))

	Promise.all(promises)
		.then(function () {
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
	if (Array.isArray(eventListeners[event.type]))
		for (let fn of eventListeners[event.type])
			fn.apply(null, [event])
}