import { logger } from '../logger'
import { format } from 'util'

export default function flyLogInit(ivm, dispatcher) {
  function log(lvl, ...args) {
    dispatcher.dispatch('log',
      lvl,
      format(...args)
    )
  }

  /**
   * Specify which logging transport to use for all your `console.log` calls.
   * @param {string} name 
   * @param {Object} options 
   */
  log.addTransport = function addTransport(name, options) {
    const cb = new ivm.Reference(function (err, added) {
      try { cb.release() } catch (e) { }
      logger.debug("added log transport... maybe!", err, added)
    })
    dispatcher.dispatch('addLogTransport', name,
      new ivm.ExternalCopy(options).copyInto({ release: true }),
      cb
    ).catch(() => {
      try { cb.release() } catch (e) { }
    })
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