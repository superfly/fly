export default function timersInit(ivm) {
  global.setTimeout = (function (st, ivm) {
    return function (cb, ms) {
      return st.apply(null, [new ivm.Reference(cb), ms])
    }
  })(global._setTimeout, ivm)
  delete global._setTimeout

  global.clearTimeout = (function (ct) {
    return function (id) {
      return ct.apply(null, [id])
    }
  })(global._clearTimeout)
  delete global._clearTimeout

  global.setInterval = (function (si, ivm) {
    return function (cb, ms) {
      return si.apply(null, [new ivm.Reference(cb), ms])
    }
  })(global._setInterval, ivm)
  delete global._setInterval

  global.clearInterval = (function (ci) {
    return function (id) {
      return ci.apply(null, [id])
    }
  })(global._clearInterval)
  delete global._clearInterval
}