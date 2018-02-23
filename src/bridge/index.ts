import { Trace } from '../trace'
import { ivm, Context, Config } from '../'
export let catalog = new Map<string, BridgeFunction>()
export function registerBridge(name: string, fn: BridgeFunction) {
  catalog.set(name, fn)
}

export type BridgeFunction = (ctx: Context, config: Config, ...args: any[]) => void