import * as ivm from 'isolated-vm'
import * as genericPool from 'generic-pool';
import * as fs from 'fs';
import log from "./log"
import { createContext, Context } from './context';

import { v8Env } from './v8env';

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
}

const isoFactory: genericPool.Factory<Isolate> = {
	create: createIsolate,

	destroy: async function (iso: Isolate): Promise<undefined> {
		try {
			iso.dispose()
		} catch (err) {
			log.error("error disposing of Isolate", err)
			throw err
		}
		return
	}
}

let snapshot: ivm.ExternalCopy<ArrayBuffer>;

let pools: IsolatePool[] = [];

export function createIsolate(): Promise<Isolate> {
	const iso = new ivm.Isolate({ snapshot })
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			createContext(iso).then(function (ctx) {
				resolve(new Isolate(iso, ctx))
			})
		}, 10)
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
		this.options = options
		this.makePool()
	}

	makePool() {
		this.pool = genericPool.createPool(isoFactory, this.options)
	}

	async resetPool() {
		const oldPool = this.pool
		this.makePool()
		await oldPool.drain()
		await oldPool.clear()
	}

	acquire() {
		return this.pool.acquire()
	}

	destroy(iso: Isolate) {
		return this.pool.destroy(iso)
	}

	drain() {
		return this.pool.drain()
	}

	clear() {
		return this.pool.clear()
	}
}

process.on('exit', () => {
	pools.forEach(async (pool) => {
		await pool.pool.drain()
		await pool.pool.clear()
	})
})