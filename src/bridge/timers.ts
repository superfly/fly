import { registerBridge } from './'

import { ivm, Context, Bridge } from '../'
import log from "../log"

registerBridge('setTimeout', function (ctx: Context, bridge: Bridge, fn: ivm.Reference<Function>, timeout: number) {
  ctx.setTimeout(fn, timeout)
})

registerBridge('clearTimeout', function (ctx: Context, bridge: Bridge, id: number) {
  ctx.clearTimeout(id)
})

registerBridge('setInterval', function (ctx: Context, bridge: Bridge, fn: ivm.Reference<Function>, every: number) {
  ctx.setInterval(fn, every)
})

registerBridge('clearInterval', function (ctx: Context, bridge: Bridge, id: number) {
  ctx.clearInterval(id)
})

