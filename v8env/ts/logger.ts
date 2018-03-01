import { format } from 'util'

declare var global: any

export const logger = {
  info(fmt: any, ...params: any[]) {
    flyLog('info', format(fmt, ...params))
  },
  error(fmt: any, ...params: any[]) {
    flyLog('error', format(fmt, ...params))
  },
  debug(fmt: any, ...params: any[]) {
    flyLog('debug', format(fmt, ...params))
  }
}

function flyLog(lvl: string, message: string) {
  if (global._log)
    global._log.apply(null, [lvl, message]);
}