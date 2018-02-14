global.localBootstrap = function localBootstrap() {
  addEventListener('log', (event) => {
    if (global._log)
      _log.apply(null, [event.log.level, event.log.message])
  })
}