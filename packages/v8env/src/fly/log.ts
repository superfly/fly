/**
 * @module fly
 * @private
 */
import { format } from "util"

declare var bridge: any

/**
 * @hidden
 */
export function log(lvl, ...args) {
  bridge.dispatch("log", lvl, format(...args))
}
