import { ivm } from './'
import log from "./log"
import { conf } from './config'
import { Bridge } from './bridge/bridge'
import { Trace } from './trace'

export class Context {
	ctx: ivm.Context
	trace: Trace | undefined
	private global: ivm.Reference<Object>
	meta: Map<string, any>

	timeouts: { [id: number]: NodeJS.Timer }
	intervals: { [id: number]: NodeJS.Timer }

	private currentTimerId: number;

	constructor(ctx: ivm.Context) {
		this.meta = new Map<string, any>()
		this.ctx = ctx
		this.global = ctx.globalReference()
		this.currentTimerId = 0
		this.timeouts = {}
		this.intervals = {}
	}

	async bootstrap() {
		await this.set('global', this.global.derefInto());
		await this.set('_ivm', ivm);

		if (conf.env !== 'production') {
			await this.set('_log', new ivm.Reference(function (lvl: string, ...args: any[]) {
				log.log(lvl, args[0], ...args.slice(1))
			}))
			await (await this.get("localBootstrap")).apply(undefined, [])
		}

		await this.set('_setTimeout', new ivm.Reference((fn: Function, timeout: number): number => {
			const id = ++this.currentTimerId
			this.timeouts[id] = setTimeout(() => { fn.apply(null, []) }, timeout)
			return id
		}))

		await this.set('_clearTimeout', new ivm.Reference((id: number): void => {
			return clearTimeout(this.timeouts[id])
		}))

		await this.set('_setInterval', new ivm.Reference((fn: Function, timeout: number): number => {
			const id = ++this.currentTimerId
			this.intervals[id] = setInterval(() => { fn.apply(null, []) }, timeout)
			return id
		}))

		await this.set('_clearInterval', new ivm.Reference((id: number): void => {
			return clearInterval(this.intervals[id])
		}))

		const bridge = new Bridge(this)
		await this.set("_dispatch", new ivm.Reference(bridge.dispatch.bind(bridge)))

		await (await this.get("bootstrap")).apply(undefined, [])
	}

	async get(name: string) {
		return await this.global.get(name)
	}

	async set(name: any, value: any) {
		return await this.global.set(name, value)
	}

	release() {
		this.cleanUp()
		this.ctx.release()
	}

	cleanUp() {
		for (const t of Object.values(this.intervals))
			clearInterval(t)
		for (const t of Object.values(this.timeouts))
			clearTimeout(t)
	}
}

export async function createContext(iso: ivm.Isolate, opts: ivm.ContextOptions = {}): Promise<Context> {
	let ctx = new Context(await iso.createContext(opts))
	await ctx.bootstrap()
	return ctx
}