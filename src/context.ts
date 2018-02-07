import { ivm } from './'
import log from "./log"
//import { conf } from './config'
import { Bridge } from './bridge/bridge'
import { Trace } from './trace'
import { Config } from './config';

export class Context {
	ctx: ivm.Context
	trace: Trace | undefined
	private global: ivm.Reference<Object>
	meta: Map<string, any>

	constructor(ctx: ivm.Context) {
		this.meta = new Map<string, any>()
		this.ctx = ctx
		this.global = ctx.globalReference()
	}

	async bootstrap(config:Config) {
		await this.set('global', this.global.derefInto());
		await this.set('_ivm', ivm);

		if (config.env !== 'production') {
			await this.set('_log', new ivm.Reference(function (lvl: string, ...args: any[]) {
				log.log(lvl, args[0], ...args.slice(1))
			}))
			await (await this.get("localBootstrap")).apply(undefined, [])
		}

		await this.set('_setTimeout', new ivm.Reference(function (fn: Function, timeout: number) {
			return new ivm.Reference(setTimeout(() => { fn.apply(null, []) }, timeout))
		}))

		await this.set('_clearTimeout', new ivm.Reference(function (timer: ivm.Reference<NodeJS.Timer>) {
			return clearTimeout(timer.deref())
		}))

		const bridge = new Bridge(this, config)
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
		this.ctx.release()
	}
}

export async function createContext(config: Config, iso: ivm.Isolate, opts: ivm.ContextOptions): Promise<Context> {
	let ctx = new Context(await iso.createContext(opts))
	await ctx.bootstrap(config)
	return ctx
}