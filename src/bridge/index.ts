import { Trace } from '../trace'
import { Config } from '../config';
export let catalog = new Map<string, BridgeFunctionFactory>()
export function registerBridge(name: string, fn: BridgeFunctionFactory) {
  catalog.set(name, fn)
}

export interface Context {
  meta: Map<string, any>
  trace: Trace | undefined,
  config: Config
}

export interface BridgeFunctionFactory {
  (ctx: Context): Function
}