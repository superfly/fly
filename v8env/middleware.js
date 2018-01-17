class MiddlewareSettings {
	constructor(settings) {
		this.settings = settings || {}
	}
	get(name) {
		return this.settings[name]
	}
}

class Cache {
	ignoreCookie() {

	}
	ignoreQueryParam() {

	}
}

class Session {
	get userID() {
		return ""
	}
	get clientID() {
		return ""
	}
}

const errMiddlewareNotPromise = new Error("Middleware does not return a promise")

export class Middleware {
	constructor(props) {
		this.type = props.type
		this.settings = new MiddlewareSettings(props.settings)
		this.fn = props.fn
		this.cache = new Cache()
		this.session = new Session()
	}

	static run(mw, settings, req) {
		const chain = new MiddlewareChain()
		chain.use(mw, settings)
		return chain.run(req)
	}
}

export class MiddlewareChain {
	constructor() {
		this.currentPos = 0
		this.chain = []
	}

	use(mw, settings) {
		// console.debug("use called", mw.type, mw.settings.toString())

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

	async run(req) {
		try {
			let res = await this.buildNext(this.chain[0], this.currentPos)(req)
			if (res instanceof Response)
				return res
			throw errMiddlewareNotPromise
		} catch (err) {
			console.debug("error running middleware chain:", err.toString())
			return new Response("Internal Server Error", {
				status: 500
			})
		}
	}

	buildNext(mw, pos) {
		console.debug("buildNext pos:", pos)
		if (!mw)
			return this.lastNextFunc

		console.debug("mw.type", mw.type)
		const newPos = ++pos
		console.debug("newPos:", newPos)
		const next = this.chain[newPos]
		return (req) => {
			console.debug("next called!")
			return this.runMiddleware(mw, req, this.buildNext(next, newPos))
		}
	}

	runMiddleware(mw, req, next) {
		console.debug("run mw:", mw.type)
		try {
			const res = mw.fn.call(mw, req, next)
			if (res instanceof Promise)
				return res
			throw errMiddlewareNotPromise
		} catch (err) {
			console.debug("error running middleware")
			console.debug(mw.type, err.toString())
			throw err
		}
	}

	lastNextFunc() {
		console.debug("last next func with req")
		return new Response("OK", {
			headers: {
				"Content-Type": "text/plain"
			},
			status: 200
		})
	}
}
