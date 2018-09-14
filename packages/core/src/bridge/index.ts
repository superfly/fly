import { Bridge } from "./bridge"
import { Runtime } from "../runtime"
export let catalog = new Map<string, BridgeFunction>()
export function registerBridge(name: string, fn: BridgeFunction) {
  catalog.set(name, fn)
}

export type BridgeFunction = (rt: Runtime, bridge: Bridge, ...args: any[]) => any
