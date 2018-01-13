import { Isolate } from '../isolate'

export let catalog = new Map<string, BridgeFunctionFactory>()
export function registerBridge(name: string, fn: BridgeFunctionFactory) {
  catalog.set(name, fn)
}

export interface Context {
  meta: Map<string, any>
}

export interface BridgeFunctionFactory {
  (ctx: Context): Function
}