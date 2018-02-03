import { format } from 'util'

export const logger = {
  info(...args) {
    nodeLog('info', format(...args))
  },
  debug(...args) {
    nodeLog('debug', format(...args))
  }
}

function nodeLog(lvl, message) {
  if (global._log)
    global._log.apply(undefined, [lvl, `(fly) ${message}`]);
}