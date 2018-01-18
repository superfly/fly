import * as ivm from 'isolated-vm'
import log from "./log"
import { Bridge } from './bridge/bridge'

export class Context {
	ctx: ivm.Context
	private global: ivm.Reference<Object>
	meta: Map<string, any>

	constructor(ctx: ivm.Context) {
		this.meta = new Map<string, any>()
		this.ctx = ctx
		this.global = ctx.globalReference()
	}

	async bootstrap() {
		await this.set('global', this.global.derefInto());
		await this.set('_ivm', ivm);
		await this.set('_log', new ivm.Reference(function (lvl: string, ...args: any[]) {
			log.log(lvl, '(v8)', ...args)
		}))

		await this.set('_setTimeout', new ivm.Reference(function (fn: Function, timeout: number) {
			return new ivm.Reference(setTimeout(() => { fn.apply(null, []) }, timeout))
		}))

		await this.set('_clearTimeout', new ivm.Reference(function (timer: ivm.Reference<NodeJS.Timer>) {
			return clearTimeout(timer.deref())
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
}

export async function createContext(iso: ivm.Isolate): Promise<Context> {
	let ctx = new Context(await iso.createContext())
	await ctx.bootstrap()
	return ctx
}