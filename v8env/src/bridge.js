import { logger } from './logger'

const DEFAULT_BRIDGE_TRANSFER_OPTIONS = {
  release: true,
  transfer: false
}

export default function initBridge(ivm, dispatch) {
  const bridge = global.bridge = {
    prepareValue(arg, opts = {}) {
      if (!arg) // false, undefined, null, 0, "" (all transferable)
        return arg

      let ctor;
      // this can bomb with certain values
      try {
        ctor = arg.constructor
      } catch (e) {
        ctor = undefined
      }

      switch (ctor) {
        // transferable ivm
        case ivm.ExternalCopy:
        case ivm.Reference:

        // primitives
        case String:
        case Number:
        case Boolean:
          return arg

        // typed arrays
        case ArrayBuffer:
        case Uint8Array:
        case Int8Array:
        case Uint8ClampedArray:
        case Int16Array:
        case Uint16Array:
        case Int32Array:
        case Uint32Array:
        case Float32Array:
        case Float64Array:
          return bridge.wrapValue(arg, opts)

        // transferable if wrapped
        case DataView:
        case Map:
        case Set:
        case RegExp:
        case Date:
        case Object: // plain object
        case Array:
          return bridge.wrapValue(arg, { release: !!opts.release, transfer: false })

        case Function:
          return bridge.wrapFunction(arg)

        // simplified-values
        case Error:
          return arg.stack || arg.message || arg.toString()

        default:
          throw new Error(`Can't prepare a non-transferable value (constructor: '${ctor && ctor.name || 'unknown'}')`);
      }
    },
    dispatch(name, ...args) {
      logger.debug("dispatch", name)
      return dispatch.apply(null, [name, ...args.map((a) => bridge.prepareValue(a))])
    },
    dispatchSync(name, ...args) {
      logger.debug("dispatchSync", name)
      return dispatch.applySyncPromise(null, [name, ...args.map((a) => bridge.prepareValue(a))])
    },

    wrapFunction(fn, options = { release: true }) {
      const opts = Object.assign({}, DEFAULT_BRIDGE_TRANSFER_OPTIONS, options || {})
      if (!opts.release)
        return new ivm.Reference(fn);

      const cb = new ivm.Reference(function bridgeAutoReleaseFn(...args) {
        try { cb.release() } catch (err) { } finally {
          fn(...args)
        }
      })
      return cb
    },

    wrapValue(value, options = { release: true }) {
      const opts = Object.assign({}, DEFAULT_BRIDGE_TRANSFER_OPTIONS, options || {})
      if (!!opts.transfer)
        return new ivm.ExternalCopy(value, { transferOut: true }).copyInto({ release: !!opts.release, transferIn: true });
      return new ivm.ExternalCopy(value).copyInto({ release: !!opts.release });
    },

    isReference(v) {
      return (v instanceof ivm.Reference)
    }

  }
  return bridge
}