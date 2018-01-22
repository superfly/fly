const { setupLocalLogging } = require('./log')

global.localBootstrap = function localBootstrap() {
  setupLocalLogging(_ivm, _log)
}