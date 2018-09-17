import { registerBridge } from "./"

import { ivm, Bridge } from "../"
import { Runtime } from "../runtime"
import { setTimeout, clearTimeout } from "timers"

registerBridge(
  "setTimeout",
  (rt: Runtime, bridge: Bridge, fn: ivm.Reference<() => void>, timeout: number) => {
    const t = setTimeout(() => {
      try {
        fn.applyIgnored(null, [])
      } catch (e) {
        // ignore
      }
      try {
        fn.release()
      } catch (e) {
        // ignore
      }
    }, timeout)
    t.unref()
    return Promise.resolve(new ivm.Reference(t))
  }
)

registerBridge("clearTimeout", (rt: Runtime, bridge: Bridge, id: ivm.Reference<NodeJS.Timer>) => {
  try {
    clearTimeout(id.deref())
  } catch (e) {
    // ignore
  }
})

registerBridge(
  "setInterval",
  (rt: Runtime, bridge: Bridge, fn: ivm.Reference<() => void>, every: number) => {
    const i = setInterval(() => {
      try {
        fn.applyIgnored(null, [])
      } catch (e) {
        // ignore
      }
      try {
        fn.release()
      } catch (e) {
        // ignore
      }
    }, every)
    i.unref()
    return Promise.resolve(new ivm.Reference(i))
  }
)

registerBridge("clearInterval", (rt: Runtime, bridge: Bridge, id: ivm.Reference<NodeJS.Timer>) => {
  try {
    clearInterval(id.deref())
  } catch (e) {
    // ignore
  }
})
