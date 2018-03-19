import { Trace } from '../trace'
import { ivm, Context } from '../'
import { Bridge } from './bridge';
export let catalog = new Map<string, BridgeFunction>()
export function registerBridge(name: string, fn: BridgeFunction) {
  catalog.set(name, fn)
}

export type BridgeFunction = (ctx: Context, bridge: Bridge, ...args: any[]) => any