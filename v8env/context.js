let called = false

let immutableGlobals = new Set()

exports.setContext = function (context) {
  if (called) // make sure that's not called more than once.
    return

  const props = Object.keys(context).reduce(function (map, prop) {
    immutableGlobals.add(prop)
    map[prop] = {
      value: context[prop],
      writable: false
    }
    return map;
  }, {})

  Object.defineProperties(global, props)

  // double make sure
  delete global.setContext
}

// small optimization, lazy reduce
let cachedContext;
exports.getContext = function getContext() {
  if (cachedContext)
    return cachedContext

  cachedContext = [...immutableGlobals].reduce(function (map, prop) {
    map[prop] = global[prop]
    return map
  }, {})

  return cachedContext
}
