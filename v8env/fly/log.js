import { logger } from '../logger'
import { format } from 'util'

export default function flyLogInit(ivm, dispatcher) {
  function log(lvl, ...args) {
    const lastArg = args[args.length - 1]
    const metadata = args.length > 1 && typeof lastArg === 'object' && lastArg
    if (metadata)
      dispatcher.dispatch('log', lvl, format(...args.slice(0, -1)), new ivm.ExternalCopy(metadata).copyInto({ release: true }))
    else
      dispatcher.dispatch('log', lvl, format(...args))
  }

  /**
   * Specify which logging transport to use for all your `console.log` calls.
   * @param {string} name 
   * @param {Object} options 
   */
  log.addTransport = function addTransport(name, options) {
    dispatcher.dispatch('addLogTransport', name,
      new ivm.ExternalCopy(options).copyInto({ release: true }),
      new ivm.Reference(function (err, added) {
        logger.debug("added log transport... maybe!", err, added)
      })
    )
  }

  /**
   * fly.log.addMetadata lets you add persistent metadata information
   * for every log entries.
   */
  log.addMetadata = function addMetadata(metadata) {
    dispatcher.dispatch('addLogMetadata',
      new ivm.ExternalCopy(metadata).copyInto({ release: true })
    )
  }
  return log
}
