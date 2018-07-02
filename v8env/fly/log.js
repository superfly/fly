import { format } from 'util'

export function log(lvl, ...args) {
  bridge.dispatch("log", lvl, format(...args))
}