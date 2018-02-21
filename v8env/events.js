import { logger } from './logger'
import { EventEmitter2 as EventEmitter } from 'eventemitter2'
import { transferInto } from './utils/buffer'
import { bodyUsedError } from './body'

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
export class FetchEvent {
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
					console.log("weird response:", res.constructor)
					this.callback(invalidResponseType)
				}).catch((err) => {
					this.callback(err)
				})
			} else if (ret instanceof Response) {
				this.callback(null, ret)
			} else {
				this.callback(invalidResponseType)
			}
		} catch (err) {
			this.callback(err)
		}
	}
}

const emitter = new EventEmitter()

export function addEventListener(name, fn) {
	emitter.addListener(name, fn)
}

export function fireEventInit(ivm) {
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

function fireFetchEvent(ivm, url, nodeReq, nodeBody, callback) {
	logger.debug("handling request event")
	nodeReq.body = nodeBody
	let req = new Request(url, nodeReq)
	let fetchEvent = new FetchEvent('fetch', { request: req }, async function (err, res) {
		logger.debug("request event callback called", typeof err, typeof res, res instanceof Response)

		if (err){
			console.log(err, err.stack)
			return callback.apply(null, [err.toString()])
		}

		if(res.bodyUsed){
			return callback.apply(null, [bodyUsedError.toString()])
		}

		let body = null
		if(res._stream instanceof ivm.Reference){
			logger.debug("Response is a proxied stream")
			body = res._stream
		}
		else if (!res._proxy) {
			body = transferInto(ivm, await res.arrayBuffer())
			logger.debug("Got arrayBuffer from response:", body.byteLength)
		}else{
			logger.debug("Response is a proxy")
		}

		callback.apply(undefined, [null,
			new ivm.ExternalCopy({
				headers: res.headers && res.headers.toJSON() || {},
				status: res.status,
				bodyUsed: res.bodyUsed,
			}).copyInto(),
			body
		])
	})
	let fn = emitter.listeners('fetch').slice(-1)[0]
	if (typeof fn !== 'function')
		return callback.apply(null, ["No 'fetch' event listener attached."])

	if (fn(fetchEvent) instanceof Promise)
		return callback.apply(null, ["'fetch' event handler function cannot return a promise."])

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

export class LogEvent {
	constructor(type = "log", init = {}) {
		this.type = type
		this.log = new LogMessage(init.level, init.message, init.timestamp || new Date)
	}
}

export function dispatchEvent(event) {
	emitter.emit(event.type, event)
}