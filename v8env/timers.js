export function setTimeout(cb, ms) {
  const ref = bridge.wrapFunction(cb)
  return bridge.dispatchSync("setTimeout", ref, ms)
}

export function clearTimeout(id) {
  bridge.dispatch("clearTimeout", id)
}

export function setInterval(cb, ms) {
  const ref = bridge.wrapFunction(cb)
  return bridge.dispatchSync("setInterval", ref, ms)
}

export function clearInterval(id) {
  bridge.dispatch("clearInterval", id)
}