export default function timersInit(ivm) {
  global.setTimeout = (function (st, ivm) {
    releasables.push(st)
    return function (cb, ms) {
      const ref = new ivm.Reference(cb)
      releasables.push(ref)
      return st.apply(null, [ref, ms])
    }
  })(global._setTimeout, ivm)
  delete global._setTimeout

  global.clearTimeout = (function (ct) {
    releasables.push(ct)
    return function (id) {
      return ct.apply(null, [id])
    }
  })(global._clearTimeout)
  delete global._clearTimeout

  global.setInterval = (function (si, ivm) {
    releasables.push(si)
    return function (cb, ms) {
      const ref = new ivm.Reference(cb)
      releasables.push(ref)
      return si.apply(null, [ref, ms])
    }
  })(global._setInterval, ivm)
  delete global._setInterval

  global.clearInterval = (function (ci) {
    releasables.push(ci)
    return function (id) {
      return ci.apply(null, [id])
    }
  })(global._clearInterval)
  delete global._clearInterval
}