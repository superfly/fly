export function setTimeout(cb, ms) {
  const ref = bridge.wrapFunction(cb)
  bridge.dispatch("setTimeout", ref, ms).catch(() => {
    try { ref.release() } catch (e) { }
  })
}

export function clearTimeout(id) {
  bridge.dispatch("clearTimeout", id)
}

export function setInterval(cb, ms) {
  const ref = bridge.wrapFunction(cb)
  releasables.push(ref)
  bridge.dispatch("setInterval", ref, ms).catch(() => {
    try { ref.release() } catch (e) { }
  })
}

export function clearInterval(id) {
  bridge.dispatch("clearInterval", id)
}