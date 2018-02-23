import { Trace } from '../trace'
import { Config } from '../config';
import { ivm } from '../'
export let catalog = new Map<string, BridgeFunction>()
export function registerBridge(name: string, fn: BridgeFunction) {
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

export interface BridgeFunction {
  (ctx: Context, config: Config, ...args: any[]): void
}