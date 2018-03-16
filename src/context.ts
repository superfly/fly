import { ivm, App } from './'
import log from "./log"
//import { conf } from './config'a
import { Bridge } from './bridge/bridge'
import { Trace } from './trace'
import { Config } from './config';
import { EventEmitter } from 'events';

import * as winston from 'winston'
import { FileStore } from './file_store';

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
	bridge: Bridge
	meta: ContextMetadata
	logger: winston.LoggerInstance
	persistentLogMetadata: any
	logMetadata: any

	timeouts: { [id: number]: NodeJS.Timer }
	intervals: { [id: number]: NodeJS.Timer }
	callbacks: ivm.Reference<Function>[]
	fireEventFn?: ivm.Reference<Function>

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
		this.bridge = new Bridge()
		this.logger = new winston.Logger()
		this.persistentLogMetadata = {}
		this.logMetadata = {}
	}

	addCallback(fn: ivm.Reference<Function>) {
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
				if (arg instanceof ivm.Reference)
					this.addReleasable(arg)
				else if (arg instanceof ivm.ExternalCopy)
					this.addReleasable(arg)
			try {
				return await fn.apply(null, args, opts)
			} catch (err) {
				if (err instanceof TypeError)
					return
				throw err
			}
		} finally {
			this.addReleasable(fn)
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

	async bootstrap(config: Config) {
		await Promise.all([
			this.set('global', this.global.derefInto()),
			this.set('_ivm', ivm),
			this.set('_setTimeout', new ivm.Reference((fn: ivm.Reference<Function>, timeout: number): number => {
				const id = ++this.currentTimerId
				this.timeouts[id] = setTimeout(() => { this.applyCallback(fn, []) }, timeout)
				this.addCallback(fn)
				return id
			})),
			this.set('_clearTimeout', new ivm.Reference((id: number): void => {
				clearTimeout(this.timeouts[id])
				delete this.timeouts[id]
				return
			})),
			this.set('_setInterval', new ivm.Reference((fn: ivm.Reference<Function>, timeout: number): number => {
				const id = ++this.currentTimerId
				// we don't add interval callbacks because we will clear them at the very end
				this.intervals[id] = setInterval(() => { fn.apply(null, []) }, timeout)
				this.addReleasable(fn)
				return id
			})),
			this.set('_clearInterval', new ivm.Reference((id: number): void => {
				clearInterval(this.intervals[id])
				delete this.intervals[id]
				return
			})),
			this.set("_dispatch", new ivm.Reference((name: string, ...args: any[]) => {
				this.bridge.dispatch(this, config, name, ...args)
			})),
			this.set('_log', new ivm.Reference(function (lvl: string, ...args: any[]) {
				log.log(lvl, args[0], ...args.slice(1))
			}))
		])

		await (await this.get("bootstrap")).apply(undefined, [])

		return
	}

	async fireEvent(name: string, args: any[], opts?: any) {
		if (this.iso.isDisposed)
			throw new Error("Isolate is disposed or disposing.")
		try {
			if (!this.fireEventFn)
				this.fireEventFn = await this.global.get("fireEvent") // bypass releasable
			for (const arg of args)
				if (arg instanceof ivm.Reference)
					this.addReleasable(arg)
				else if (arg instanceof ivm.ExternalCopy)
					this.addReleasable(arg)
			log.silly("Firing event", name)
			const ret = await this.fireEventFn.apply(null, [name, ...args], opts)
			if (ret instanceof ivm.Reference)
				this.addReleasable(ret)
			else if (ret instanceof ivm.ExternalCopy)
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
		const ret = await this.global.set(name, value)
		if (value instanceof ivm.Reference)
			this.addReleasable(value)
		else if (value instanceof ivm.ExternalCopy)
			this.addReleasable(value)
		return ret
	}

	async release() {
		const teardownFn = await this.global.get("teardown")
		await teardownFn.apply(null, [])
		teardownFn.release()
		this.fireEventFn && this.fireEventFn.release()
		this.global.release()
		this.callbacks = []
		this.intervals = {}
		this.timeouts = {}
		this.logger.close()
		this.ctx.release()
	}

	async finalize() {
		log.debug("Finalizing context.")

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
			// clear all intervals no matter what
			for (const [id, t] of Object.entries(this.intervals)) {
				clearInterval(t)
				delete this.intervals[parseInt(id)] // stupid ts.
			}
			let rel;
			while (rel = this.releasables.pop()) {
				try {
					rel.release()
				} catch (e) {
					// don't really care
				}
			}
			this.logMetadata = {} // reset log meta data!
		}
	}

	async runApp(app: App, t?: Trace) {
		t = t || Trace.start("runApp")
		const sourceFilename = 'bundle.js'
		const sourceMapFilename = 'bundle.map.json'

		const source = app.sourceMap ? app.source + `\n;sourceMaps["${sourceFilename}"] = {filename: "${sourceMapFilename}", map: ${app.sourceMap}}` : app.source

		const tcomp = t.start("compile")
		let script: ivm.Script
		try {
			script = await this.iso.compileScript(source, { filename: sourceFilename })
		} catch (err) {
			if (err instanceof SyntaxError && source != app.source) {
				log.error("App + sourcemap is invalid, trying again without sourcemap")
				script = await this.iso.compileScript(app.source, { filename: sourceFilename }) // this can rethrow
			} else {
				throw err
			}
		} finally {
			tcomp.end()
		}
		const trun = t.start("prerun")
		await script.run(this.ctx)
		trun.end()
	}
}

export async function createContext(config: Config, iso: ivm.Isolate, opts: ivm.ContextOptions = {}): Promise<Context> {
	let ctx = new Context(await iso.createContext(opts), iso)
	await ctx.bootstrap(config)
	return ctx
}