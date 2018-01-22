const { addEventListener } = require('../events')

exports.setupLocalLogging = function setupLocalLogging(ivm, nodeLog) {
  addEventListener('log', (event) => {
    nodeLog.apply(null, [event.log.level, event.log.message])
  })
}