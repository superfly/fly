import { registerBridge } from './'

import { ivm, Bridge } from '../'
import { Runtime } from '../runtime';
import { setTimeout, clearTimeout } from "timers"

registerBridge('setTimeout', function (rt: Runtime, bridge: Bridge, fn: ivm.Reference<Function>, timeout: number) {
  const t = setTimeout(function () {
    try { fn.applyIgnored(null, []) } catch (e) { }
    try { fn.release() } catch (e) { }
  }, timeout)
  t.unref()
  return Promise.resolve(new ivm.Reference(t))
})

registerBridge('clearTimeout', function (rt: Runtime, bridge: Bridge, id: ivm.Reference<NodeJS.Timer>) {
  try { clearTimeout(id.deref()) } catch (e) { }
})

registerBridge('setInterval', function (rt: Runtime, bridge: Bridge, fn: ivm.Reference<Function>, every: number) {
  const i = setInterval(function () {
    try { fn.applyIgnored(null, []) } catch (e) { }
    try { fn.release() } catch (e) { }
  }, every)
  i.unref()
  return Promise.resolve(new ivm.Reference(i))
})

registerBridge('clearInterval', function (rt: Runtime, bridge: Bridge, id: ivm.Reference<NodeJS.Timer>) {
  try { clearInterval(id.deref()) } catch (e) { }
})

