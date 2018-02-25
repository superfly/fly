import { format } from 'util'

export const logger = {
  info(...args) {
    flyLog('info', format(...args))
  },
  error(...args) {
    flyLog('error', format(...args))
  },
  debug(...args) {
    flyLog('debug', format(...args))
  }
}

function flyLog(lvl, message) {
  if (global._log)
    global._log.apply(null, [lvl, message]);
}