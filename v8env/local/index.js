import { setupLocalLogging } from './log'

global.localBootstrap = function localBootstrap() {
  setupLocalLogging(_ivm, _log)
}