import { Trace } from '../trace'
import { Config } from '../config';
import { ivm } from '../'
export let catalog = new Map<string, BridgeFunctionFactory>()
export function registerBridge(name: string, fn: BridgeFunctionFactory) {
  catalog.set(name, fn)
}

export interface Context {
  meta: Map<string, any>
  trace: Trace | undefined
  addCallback(fn: ivm.Reference<Function>): any
  applyCallback(fn: ivm.Reference<Function>, args: any[]): Promise<any>
}

export interface BridgeFunctionFactory {
  (ctx: Context, config: Config): Function
}