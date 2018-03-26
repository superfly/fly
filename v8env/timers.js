let st, ct, si, ci;

export {
  st as setTimeout,
  ct as clearTimeout,
  si as setInterval,
  ci as clearInterval
}

export default function timersInit(ivm, dispatcher) {
  st = function (cb, ms) {
    const ref = new ivm.Reference(function () {
      ref.release()
      cb()
    })
    dispatcher.dispatch("setTimeout", ref, ms).catch(() => {
      try { ref.release() } catch (e) { }
    })
  }

  ct = function (id) {
    dispatcher.dispatch("clearTimeout", id)
  }

  si = function (cb, ms) {
    const ref = new ivm.Reference(cb)
    releasables.push(ref)
    dispatcher.dispatch("setInterval", ref, ms).catch(() => {
      try { ref.release() } catch (e) { }
    })
  }

  ci = function (id) {
    dispatcher.dispatch("clearInterval", id)
  }
}