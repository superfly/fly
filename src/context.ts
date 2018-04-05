import { ivm, App } from './'
import log from "./log"
//import { conf } from './config'a
import { Bridge, BridgeOptions } from './bridge/bridge'
import { Trace } from './trace'
import { EventEmitter } from 'events';

import * as winston from 'winston'

export interface Releasable {
	release(): void
}

export interface ContextMetadata {
	app?: App
	requestId?: string
	originalScheme?: string
	originalHost?: string
	originalPath?: string
	originalURL?: string
	flyDepth?: number

	[key: string]: any
}

export interface ApplyableFunction {
	apply(self?: any, args?: any[]): void
}

export class Context extends EventEmitter {
	ctx: ivm.Context
	trace: Trace | undefined
	private global: ivm.Reference<Object>
	meta: ContextMetadata
	logger: winston.LoggerInstance
	persistentLogMetadata: any
	logMetadata: any

	timeouts: { [id: number]: NodeJS.Timer }
	intervals: { [id: number]: NodeJS.Timer }
	callbacks: ivm.Reference<Function>[]
	fireFetchEventFn?: ivm.Reference<Function>

	releasables: Releasable[]

	iso: ivm.Isolate

	private currentTimerId: number;

	constructor(ctx: ivm.Context, iso: ivm.Isolate) {
		super()
		this.meta = {}
		this.ctx = ctx
		this.currentTimerId = 0
		this.timeouts = {}
		this.intervals = {}
		this.callbacks = []
		this.releasables = []
		this.iso = iso
		this.global = ctx.globalReference()
		this.logger = new winston.Logger()
		this.persistentLogMetadata = {}
		this.logMetadata = {}
	}

	addCallback(fn: ivm.Reference<Function>) {
		this.addReleasable(fn)
		this.callbacks.push(fn)
		log.silly("Added callback", fn)
		this.emit("callbackAdded", fn)
	}

	async applyCallback(fn: ivm.Reference<Function>, args: any[], opts?: any) {
		try {
			return await this._applyCallback(fn, args, opts)
		} catch (err) {
			log.error("Caught error while calling back:", err)
			this.emit("error", err)
		}
	}

	async _applyCallback(fn: ivm.Reference<Function>, args: any[], opts?: any) {
		log.silly("Applying callback", fn, args)
		try {
			if (this.iso.isDisposed)
				return
			for (const arg of args)
				if (arg && typeof arg.release === 'function')
					this.addReleasable(arg)
			try {
				return await fn.apply(null, args, opts)
			} catch (err) {
				if (err instanceof TypeError)
					return
				throw err
			}
		} finally {
			const i = this.callbacks.indexOf(fn)
			if (i >= 0) {
				this.callbacks.splice(i, 1)
				this.emit("callbackApplied")
			}
		}
	}

	async tryCallback(fn: ivm.Reference<Function>, args: any[], opts?: any) {
		try {
			return await this._applyCallback(fn, args, opts)
		} catch (err) {
			log.error("Error trying to apply callback", err)
		}
	}

	log(lvl: string, msg: string, meta?: any, cb?: ivm.Reference<Function>) {
		if (cb)
			this.addCallback(cb)
		this.logger.log(lvl, msg, Object.assign({}, this.persistentLogMetadata, this.logMetadata, meta || {}), (error?: any, level?: string, msg?: string, meta?: any) => {
			if (cb)
				this.tryCallback(cb, [])
		})
	}

	addReleasable(ref: ivm.Reference<any>): ivm.Reference<any>;
	addReleasable(ec: ivm.ExternalCopy<any>): ivm.ExternalCopy<any>;
	addReleasable(rel: ivm.Reference<any> | ivm.ExternalCopy<any>) {
		if (this.releasables.indexOf(rel) === -1)
			this.releasables.push(rel)
		return rel
	}

	setTimeout(fn: ivm.Reference<Function>, timeout: number) {
		const id = ++this.currentTimerId
		this.timeouts[id] = setTimeout(() => { this.applyCallback(fn, []) }, timeout)
		this.addCallback(fn)
		return id
	}

	clearTimeout(id: number) {
		clearTimeout(this.timeouts[id])
		delete this.timeouts[id]
		return
	}

	setInterval(fn: ivm.Reference<Function>, every: number) {
		const id = ++this.currentTimerId
		// we don't add interval callbacks because we will clear them at the very end
		this.intervals[id] = setInterval(() => { fn.apply(null, []) }, every)
		this.addReleasable(fn)
		return id
	}

	clearInterval(id: number) {
		clearInterval(this.intervals[id])
		delete this.intervals[id]
		return
	}

	async bootstrap(bridge: Bridge) {
		await Promise.all([
			this.set('global', this.global.derefInto()),
			this.set('_ivm', ivm),
			this.set("_dispatch", new ivm.Reference((name: string, ...args: any[]) => {
				return bridge.dispatch(this, name, ...args)
			})),
			this.set('_log', new ivm.Reference(function (lvl: string, ...args: any[]) {
				log.log(lvl, args[0], ...args.slice(1))
			}))
		])

		const bootstrapFn = await this.get("bootstrap")
		try {
			await bootstrapFn.apply()
		} finally {
			tryRelease(bootstrapFn)
		}

		return
	}

	async fireFetchEvent(args: any[], opts?: any) {
		if (this.iso.isDisposed)
			throw new Error("Isolate is disposed or disposing.")
		try {
			if (!this.fireFetchEventFn)
				this.fireFetchEventFn = await this.global.get("fireFetchEvent") // bypass releasable
			for (const arg of args)
				if (arg && typeof arg.release === 'function')
					this.addReleasable(arg)
			log.silly("Firing fetch event")
			const ret = await this.fireFetchEventFn.apply(null, args, opts)
			if (ret && typeof ret.release === 'function')
				this.addReleasable(ret)
			return ret
		} catch (err) {
			log.error("Error firing event:", err)
			this.emit("error", err)
		}
	}

	async get(name: string) {
		if (this.iso.isDisposed)
			throw new Error("Isolate is disposed or disposing.")
		return this.addReleasable(await this.global.get(name))
	}

	async set(name: any, value: any): Promise<boolean> {
		if (this.iso.isDisposed)
			throw new Error("Isolate is disposed or disposing.")
		const ret = this.global.set(name, value)
		if (value && typeof value.release === 'function')
			this.addReleasable(value)
		return ret
	}

	async runApp(app: App, t?: Trace) {
		t = t || Trace.start("runApp")

		const sourceFilename = 'bundle.js'
		const sourceMapFilename = 'bundle.map.json'

		const source = app.source

		const tcomp = t.start("compile")
		const script = await this.iso.compileScript(source, { filename: sourceFilename })
		tcomp.end()

		const trun = t.start("prerun")
		await script.run(this.ctx)
		trun.end()
	}

	async release() {
		await this.runV8Teardown()
		this.fireFetchEventFn && tryRelease(this.fireFetchEventFn)
		tryRelease(this.global)
		this.callbacks = []
		this.intervals = {}
		this.timeouts = {}
		tryRelease(this.ctx)
	}

	// forcibly destroy everything about this context
	destroy() {
		this.clearIntervals()
		this.clearTimeouts()

		for (let cb of this.callbacks) {
			this.tryCallback(cb, ["Destroying context."])
		}

		this.releaseAll()
		this.release()
	}

	async finalize() {
		try {
			await new Promise((resolve) => {
				if (this.callbacks.length === 0) {
					return resolve()
				}
				log.silly("Callbacks present initially, waiting.")
				const cbFn = () => {
					log.silly("Callback applied handler in finalize.", this.callbacks.length)
					if (this.callbacks.length === 0) {
						this.removeListener("callbackApplied", cbFn)
						resolve()
						return
					}
					log.silly("Callbacks still present, waiting.", this.callbacks.length)
				}
				this.on("callbackApplied", cbFn)
			})
		} finally {

			await this.runV8Finalize()

			// clear all intervals no matter what
			this.clearIntervals()
			this.releaseAll()
			this.logMetadata = {} // reset log meta data!
		}
	}

	async runV8Finalize() {
		try {
			const finalizeFn = await this.global.get("finalize")
			await finalizeFn.apply(null, [])
			tryRelease(finalizeFn)
		} catch (e) {

		}
	}

	async runV8Teardown() {
		try {
			const teardownFn = await this.global.get("teardown")
			await teardownFn.apply(null, [])
			tryRelease(teardownFn)
		} catch (err) {
			log.error("error tearing down v8:", err.stack)
		}
	}

	releaseAll() {
		let rel;
		while (rel = this.releasables.pop()) {
			tryRelease(rel)
		}
	}

	clearTimeouts() {
		for (const [id, t] of Object.entries(this.timeouts)) {
			clearTimeout(t)
			delete this.timeouts[parseInt(id, 10)]
		}
	}

	clearIntervals() {
		for (const [id, t] of Object.entries(this.intervals)) {
			clearInterval(t)
			delete this.intervals[parseInt(id, 10)] // stupid ts.
		}
	}

}

export async function createContext(iso: ivm.Isolate, bridge: Bridge, opts: ivm.ContextOptions = {}): Promise<Context> {
	let ctx = new Context(await iso.createContext(opts), iso)
	await ctx.bootstrap(bridge)
	return ctx
}

function tryRelease(rel: Releasable) {
	try {
		rel.release()
	} catch (e) { }
}