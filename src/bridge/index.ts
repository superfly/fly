import { Trace } from '../trace'
import { Config } from '../config';
import * as ivm from 'isolated-vm'
export let catalog = new Map<string, BridgeFunctionFactory>()
export function registerBridge(name: string, fn: BridgeFunctionFactory) {
  catalog.set(name, fn)
}

export interface Context {
  meta: Map<string, any>
  trace: Trace | undefined
  iso: ivm.Isolate,
  addCallback(fn: ivm.Reference<Function>): any
  applyCallback(fn: ivm.Reference<Function>, args: any[]): Promise<void>
  tryCallback(fn: ivm.Reference<Function>, args: any[]): Promise<void>
}

export interface BridgeFunctionFactory {
  (ctx: Context, config: Config): Function
}