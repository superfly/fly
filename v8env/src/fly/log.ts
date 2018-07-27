import { format } from 'util'

declare var bridge: any

export function log(lvl, ...args) {
  bridge.dispatch("log", lvl, format(...args))
}