import * as ivm from 'isolated-vm'
import log from "./log"
import './bridge'
import { catalog } from './bridge/catalog'

export async function createContext(iso: ivm.Isolate): Promise<ivm.Context> {
	let ctx = await iso.createContext()
	let jail = ctx.globalReference()

	await jail.set('global', jail.derefInto());
	await jail.set('_ivm', ivm);
	await jail.set('_log', new ivm.Reference(function (...args: any[]) {
		console.log(...args.slice(1))
		// console[args[0]].call(null, ...args.slice(1))
		// console.log(...args)
	}))

	await jail.set('_setTimeout', new ivm.Reference(function (fn: Function, timeout: number) {
		return new ivm.Reference(setTimeout(() => { fn.apply(null, []) }, timeout))
	}))

	await jail.set('_clearTimeout', new ivm.Reference(function (timer: ivm.Reference<NodeJS.Timer>) {
		return clearTimeout(timer.deref())
	}))

	await jail.set("_dispatch", new ivm.Reference(function (name: string, ...args: any[]) {
		dispatch(name, ...args)
	}))

	await (await ctx.globalReference().get("bootstrap")).apply(undefined, [])

	return ctx
}

function dispatch(name: string, ...args: any[]) {
	const fn = catalog.get(name)
	if (!fn)
		throw new Error("dispatch did not find function " + name)
	fn.apply(undefined, args)
	return
}