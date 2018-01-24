import * as ivm from 'isolated-vm'
import * as genericPool from 'generic-pool';
import * as fs from 'fs';
import log from "./log"
import { createContext, Context } from './context';

import { v8Env } from './v8env';

const testScript = `
typeof addEventListener !== 'undefined'
`

export class Isolate {
	iso: ivm.Isolate
	ctx: Context
	constructor(iso: ivm.Isolate, ctx: Context) {
		this.iso = iso
		this.ctx = ctx
	}
	dispose() {
		return this.iso.dispose()
	}
	async test() {
		let allgood: boolean;
		try {
			const s = await this.iso.compileScript(testScript)
			allgood = await s.run(this.ctx.ctx)
		} catch (e) {
			log.error("error testing isolate!", e)
			throw e
		}
		if (!allgood) {
			log.error("isolate was bad!")
			throw new Error("isolate was not setup correctly.")
		}
	}
}

const isoFactory: genericPool.Factory<Isolate> = {
	create: createIsolate,

	destroy: function (iso: Isolate): Promise<undefined> {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				try {
					iso.dispose()
					resolve()
				} catch (err) {
					log.error("error disposing of Isolate", err)
					reject(err)
				}
			}, 500)
		})
	}
}

let snapshot: ivm.ExternalCopy<ArrayBuffer>;

let pools: IsolatePool[] = [];

export function createIsolate(): Promise<Isolate> {
	const ivmIso = new ivm.Isolate({ snapshot })
	return new Promise((resolve, reject) => {
		createContext(ivmIso).then(function (ctx) {
			const iso = new Isolate(ivmIso, ctx)
			// test the isolate!
			iso.test().then(() => resolve(iso)).catch(reject)
		})
	})
}

export async function createIsoPool(options?: genericPool.Options): Promise<IsolatePool> {
	console.log("Creating v8 isolate pool.")
	await v8Env.waitForReadiness()
	options || (options = { min: 20, max: 50 })
	const pool = new IsolatePool(options)
	pools.push(pool)
	return pool
}

v8Env.on('snapshot', (newSnapshot: ivm.ExternalCopy<ArrayBuffer>) => {
	snapshot = newSnapshot
	pools.forEach(async (pool) => {
		await pool.resetPool()
	})
})

export class IsolatePool {
	pool: genericPool.Pool<Isolate>
	options: genericPool.Options

	constructor(options: genericPool.Options) {
		log.debug("new iso pool")
		this.options = options
		this.makePool()
	}

	makePool() {
		log.debug("make a pool")
		this.pool = genericPool.createPool(isoFactory, this.options)
	}

	async resetPool() {
		log.debug("reset iso pool")
		const oldPool = this.pool
		this.makePool()
		await oldPool.drain()
		await oldPool.clear()
	}

	acquire() {
		log.debug("acquire from iso pool")
		return this.pool.acquire()
	}

	destroy(iso: Isolate) {
		log.debug("destroy in iso pool")
		return this.pool.destroy(iso)
	}

	drain() {
		log.debug("drain iso pool")
		return this.pool.drain.bind(this.pool)()
	}

	clear() {
		log.debug("clear iso pool")
		return this.pool.clear.bind(this.pool)()
	}
}

process.on('exit', () => {
	pools.forEach(async (pool) => {
		await pool.pool.drain()
		await pool.pool.clear()
	})
})