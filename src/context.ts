import { ivm } from './'
import log from "./log"
//import { conf } from './config'a
import { Bridge } from './bridge/bridge'
import { Trace } from './trace'
import { Config } from './config';
import { EventEmitter } from 'events';

export class Context extends EventEmitter {
	ctx: ivm.Context
	trace: Trace | undefined
	private global: ivm.Reference<Object>
	meta: Map<string, any>

	timeouts: { [id: number]: NodeJS.Timer }
	intervals: { [id: number]: NodeJS.Timer }
	callbacks: ivm.Reference<Function>[]

	fireEventFn?: ivm.Reference<Function>

	iso: ivm.Isolate

	private currentTimerId: number;

	constructor(ctx: ivm.Context, iso: ivm.Isolate) {
		super()
		this.meta = new Map<string, any>()
		this.ctx = ctx
		this.global = ctx.globalReference()
		this.currentTimerId = 0
		this.timeouts = {}
		this.intervals = {}
		this.callbacks = []
		this.iso = iso
	}

	addCallback(fn: ivm.Reference<Function>) {
		this.callbacks.push(fn)
		this.emit("callbackAdded", fn)
		log.silly("Added a callback")
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
		log.silly("Applying callback to context.")
		try {
			if (this.iso.isDisposed)
				return
			return await fn.apply(null, args, opts)
		} finally {
			const i = this.callbacks.indexOf(fn)
			if (i !== -1) {
				this.callbacks.splice(i, 1)
				this.emit("callbackApplied")
			}
			log.silly("Done with callback.")
		}
	}

	async tryCallback(fn: ivm.Reference<Function>, args: any[], opts?: any) {
		try {
			return await this._applyCallback(fn, args, opts)
		} catch (err) {
			log.error("Error trying to apply callback", err)
		}
	}

	async bootstrap(config: Config) {
		await this.set('global', this.global.derefInto());
		await this.set('_ivm', ivm);

		await this.set('_setTimeout', new ivm.Reference((fn: ivm.Reference<Function>, timeout: number): number => {
			const id = ++this.currentTimerId
			this.timeouts[id] = setTimeout(() => { this.applyCallback(fn, []) }, timeout)
			this.addCallback(fn)
			return id
		}))

		await this.set('_clearTimeout', new ivm.Reference((id: number): void => {
			clearTimeout(this.timeouts[id])
			delete this.timeouts[id]
			return
		}))

		await this.set('_setInterval', new ivm.Reference((fn: ivm.Reference<Function>, timeout: number): number => {
			const id = ++this.currentTimerId
			// we don't add interval callbacks because we will clear them at the very end
			this.intervals[id] = setInterval(() => { fn.apply(null, []) }, timeout)
			return id
		}))

		await this.set('_clearInterval', new ivm.Reference((id: number): void => {
			clearInterval(this.intervals[id])
			delete this.intervals[id]
			return
		}))

		const bridge = new Bridge(this, config)
		await this.set("_dispatch", new ivm.Reference(bridge.dispatch.bind(bridge)))

		await (await this.get("bootstrap")).apply(undefined, [])

		if (config.env !== 'production') {
			await this.set('_log', new ivm.Reference(function (lvl: string, ...args: any[]) {
				log.log(lvl, args[0], ...args.slice(1))
			}))
			await (await this.get("localBootstrap")).apply(undefined, [])
		}
	}

	async fireEvent(name: string, args: any[], opts?: any) {
		if (this.iso.isDisposed)
			throw new Error("Isolate is disposed or disposing.")
		try {
			if (!this.fireEventFn)
				this.fireEventFn = await this.get("fireEvent")
			log.debug("Firing event", name)
			return await this.fireEventFn.apply(null, [name, ...args], opts)
		} catch (err) {
			log.error("Error firing event:", err)
			this.emit("error", err)
		}
	}

	async get(name: string) {
		if (this.iso.isDisposed)
			throw new Error("Isolate is disposed or disposing.")
		log.silly("Getting global", name)
		return await this.global.get(name)
	}

	async set(name: any, value: any) {
		if (this.iso.isDisposed)
			throw new Error("Isolate is disposed or disposing.")
		log.silly("Setting global", name)
		return await this.global.set(name, value)
	}

	release() {
		this.ctx.release()
	}

	async finalize() {
		log.debug("Finalizing context.")
		await new Promise((resolve) => {
			if (this.callbacks.length === 0) {
				return resolve()
			}
			log.debug("Callbacks present initially, waiting.")
			this.on("callbackApplied", () => {
				if (this.callbacks.length === 0) {
					return resolve()
				}
				log.debug("Callbacks still present, waiting.")
			})
		})
		// clear all intervals no matter what
		for (const t of Object.values(this.intervals))
			clearInterval(t)
	}
}

export async function createContext(config: Config, iso: ivm.Isolate, opts: ivm.ContextOptions = {}): Promise<Context> {
	let ctx = new Context(await iso.createContext(opts), iso)
	await ctx.bootstrap(config)
	return ctx
}