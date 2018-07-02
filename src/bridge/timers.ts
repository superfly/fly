import { registerBridge } from './'

import { ivm, Bridge } from '../'
import { Runtime } from '../runtime';

registerBridge('setTimeout', function (rt: Runtime, bridge: Bridge, fn: ivm.Reference<Function>, timeout: number) {
  return Promise.resolve(new ivm.Reference(setTimeout(function () {
    try { fn.applyIgnored(null, []) } catch (e) { }
    try { fn.release() } catch (e) { }
  }, timeout)))
})

registerBridge('clearTimeout', function (rt: Runtime, bridge: Bridge, id: ivm.Reference<NodeJS.Timer>) {
  try { clearTimeout(id.deref()) } catch (e) { }
})

registerBridge('setInterval', function (rt: Runtime, bridge: Bridge, fn: ivm.Reference<Function>, every: number) {
  return Promise.resolve(new ivm.Reference(setInterval(function () {
    try { fn.applyIgnored(null, []) } catch (e) { }
    try { fn.release() } catch (e) { }
  }, every)))
})

registerBridge('clearInterval', function (rt: Runtime, bridge: Bridge, id: ivm.Reference<NodeJS.Timer>) {
  try { clearInterval(id.deref()) } catch (e) { }
})

