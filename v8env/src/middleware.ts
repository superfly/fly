/**
 * @module fly
 * @private
 * @hidden
 */
import { logger } from './logger'

declare var middleware: any

class MiddlewareSettings {
	settings: {}
	constructor(settings) {
		this.settings = settings || {}
	}
	get(name) {
		return this.settings[name]
	}
}

const errMiddlewareNotPromise = new Error("Middleware did not return a promise")

/**
 * Middleware functions must implement this signature.
 * They must accept a `req` and a `next` parameter, and return a `Rseponse`.
 * @function middlewareFn
 * @callback middlewareFn
 * @param {Request} request The HTTP request to operate on
 * @param {function} next A function to process subsequent middleware
 * @returns {Response} The response to serve to the user
 * @hidden
 */

/**
 * A single Middleware. Middleware accepts a request, does its business, and then returns a Response.
 * @param {Object} props
 * @param {string} [props.type] Key for a prebuilt middleware
 * @param {string} [props.fn] A function to use as middleware
 * @param {Object.<string,Object>} [props.settings] Settings to hand off to the middleware
 * @hidden
 */
export class Middleware {
	type: any
	settings: MiddlewareSettings
	fn: any

	constructor(props) {
		this.type = props.type
		this.settings = new MiddlewareSettings(props.settings)
		this.fn = props.fn
	}

	/**
	 * Runs a single middleware instance
	 * @param {Middleware} mw  The middleware to run
	 * @param {Object.<string,Object>} settings Settings for this middleware run
	 * @param {Request} req The HTTP request to operate on
	 */
	static run(mw, settings, req) {
		const chain = new MiddlewareChain()
		chain.use(mw, settings)
		return chain.run(req)
	}
}

/**
 * A chain of middleware to execute in order
 * @hidden
 */
export class MiddlewareChain {
	currentPos: number
	chain: any[]

	constructor() {
		this.currentPos = 0
		this.chain = []
	}

	/**
	 * Appends middleware to the chain
	 * @param {Middleware} mw Middleware to add to the chain
	 * @param {Object.<string,Object>} settings Settings for this middleware
	 */
	use(mw, settings) {
		// logger.debug("use called", mw.type, mw.settings.toString())

		if (mw instanceof Middleware)
			this.chain.push(mw)
		else if (typeof mw === "object")
			this.chain.push(new Middleware(mw))
		else if (typeof mw === "string") {
			let fn = middleware[mw]
			if (fn)
				this.chain.push(new Middleware({
					type: mw,
					settings: settings,
					fn: fn
				}))
			else
				throw new Error("middleware " + mw + " not found")
		} else if (typeof mw === "function")
			this.chain.push(new Middleware({
				type: "custom",
				settings: {},
				fn: mw
			}))
		else
			this.chain.push(new Middleware(mw))
	}

	/**
	 * Runs the chain of middleware
	 * @param {Request} req The HTTP request to thread through the chain
	 * @returns {Response} The resulting response
	 */
	async run(req) {
		try {
			let res = await this.buildNext(this.chain[0], this.currentPos)(req)
			if (res instanceof Response)
				return res
			throw errMiddlewareNotPromise
		} catch (err) {
			logger.debug("error running middleware chain:", err.toString())
			return new Response("Internal Server Error", {
				status: 500
			})
		}
	}

	buildNext(mw, pos) {
		logger.debug("buildNext pos:", pos)
		if (!mw)
			return this.lastNextFunc

		logger.debug("mw.type", mw.type)
		const newPos = ++pos
		logger.debug("newPos:", newPos)
		const next = this.chain[newPos]
		return (req) => {
			logger.debug("next called!")
			return this.runMiddleware(mw, req, this.buildNext(next, newPos))
		}
	}

	runMiddleware(mw, req, next) {
		logger.debug("run mw:", mw.type)
		try {
			const res = mw.fn.call(mw, req, next)
			if (res instanceof Promise)
				return res
			throw errMiddlewareNotPromise
		} catch (err) {
			logger.debug("error running middleware")
			logger.debug(mw.type, err.toString())
			throw err
		}
	}

	lastNextFunc() {
		logger.debug("last next func with req")
		return new Response("OK", {
			headers: {
				"Content-Type": "text/plain"
			},
			status: 200
		})
	}
}
