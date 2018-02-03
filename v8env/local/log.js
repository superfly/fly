import { addEventListener } from '../events'

export function setupLocalLogging(ivm, nodeLog) {
  addEventListener('log', (event) => {
    nodeLog.apply(null, [event.log.level, event.log.message])
  })
}