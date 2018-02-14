global.localBootstrap = function localBootstrap() {
  global.flyLog = function (lvl, ...args) {
    _log.apply(null, [lvl].concat(args))
  }
  addEventListener('log', (event) => {
    flyLog(event.log.level, event.log.message)
  })
}