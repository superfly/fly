let st, ct, si, ci;

export {
  st as setTimeout,
  ct as clearTimeout,
  si as setInterval,
  ci as clearInterval
}

export default function timersInit(ivm) {
  st = (function (st, ivm) {
    releasables.push(st)
    return function (cb, ms) {
      const ref = new ivm.Reference(function () {
        ref.release()
        cb()
      })
      return st.apply(null, [ref, ms]).catch(() => {
        try { ref.release() } catch (e) { }
      })
    }
  })(global._setTimeout, ivm)
  delete global._setTimeout

  ct = (function (ct) {
    releasables.push(ct)
    return function (id) {
      return ct.apply(null, [id])
    }
  })(global._clearTimeout)
  delete global._clearTimeout

  si = (function (si, ivm) {
    releasables.push(si)
    return function (cb, ms) {
      const ref = new ivm.Reference(cb) // can't self-release, may run multiple times.
      releasables.push(ref)
      return si.apply(null, [ref, ms]).catch(() => {
        try { ref.release() } catch (e) { }
      })
    }
  })(global._setInterval, ivm)
  delete global._setInterval

  ci = (function (ci) {
    releasables.push(ci)
    return function (id) {
      return ci.apply(null, [id])
    }
  })(global._clearInterval)
  delete global._clearInterval
}