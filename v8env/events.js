import SessionStore from './session_store'
import { logger } from './logger'
import { EventEmitter2 as EventEmitter } from 'eventemitter2'
import { transferInto } from './utils/buffer'
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
					logger.debug("weird response:", res.constructor)
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

export const emitter = new EventEmitter()

export function addEventListener(name, fn) {
	emitter.addListener(name, fn)
}

export function fireFetchEvent(ivm, url, req, body, callback) {
	logger.debug("handling request event")
	let selfCleaningCallback = function selfCleaningCallback(...args) {
		callback.apply(null, args)
		callback.release()
		body.release()
	}

	// reset the session
	global.session = new SessionStore()

	let fetchEvent = new FetchEvent('fetch', {
		request: new Request(url, Object.assign(req, { body: fly.streams.refToStream(body) }))
	}, async function (err, res) {
		logger.debug("request event callback called", typeof err, typeof res, res instanceof Response)

		if (err) {
			logger.error(err, err.stack)
			return selfCleaningCallback.apply(null, [err.toString()])
		}

		if (res.bodyUsed) {
			return selfCleaningCallback.apply(null, [(new Error("Body has already been used")).toString()])
		}

		let b = null
		if (res.body && res.body._ref) {
			b = res.body._ref
		} else {
			b = transferInto(ivm, await res.arrayBuffer())
		}

		selfCleaningCallback.apply(undefined, [null,
			new ivm.ExternalCopy({
				headers: res.headers && res.headers.toJSON() || {},
				status: res.status
			}).copyInto({ release: true }),
			b
		])
	})
	let fn = emitter.listeners('fetch').slice(-1)[0]
	if (typeof fn !== 'function')
		return selfCleaningCallback.apply(null, ["No 'fetch' event listener attached."])

	if (fn(fetchEvent) instanceof Promise)
		return selfCleaningCallback.apply(null, ["'fetch' event handler function cannot return a promise."])

	if (!fetchEvent.respondWithEntered)
		return selfCleaningCallback.apply(null, ["respondWith was not called for FetchEvent"])
}

export function dispatchEvent(event) {
	emitter.emit(event.type, event)
}
