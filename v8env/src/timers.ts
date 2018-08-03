
declare var bridge: any

export function setTimeout(cb, ms) {
  const ref = bridge.wrapFunction(cb)
  return bridge.dispatchSync("setTimeout", ref, ms)
}

export function clearTimeout(id) {
  bridge.dispatch("clearTimeout", id)
}

export function setImmediate(cb) {
  setTimeout(cb, 0)
}

export function setInterval(cb, ms) {
  const ref = bridge.wrapFunction(cb)
  return bridge.dispatchSync("setInterval", ref, ms)
}

export function clearInterval(id) {
  bridge.dispatch("clearInterval", id)
}