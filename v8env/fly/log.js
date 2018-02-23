import { logger } from '../logger'
import { format } from 'util'

export default function flyLogInit(ivm, dispatcher) {
  function log(lvl, ...args) {
    dispatcher.dispatch('log', lvl, format(...args))
  }
  log.addTransport = function addTransport(name, options) {
    dispatcher.dispatch('addLogTransport', name,
      new ivm.ExternalCopy(options).copyInto({ release: true }),
      new ivm.Reference(function (err, added) {
        logger.debug("added log transport... maybe!", err, added)
      })
    )
  }
  return log
}
