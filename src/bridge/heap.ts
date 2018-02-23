import { registerBridge } from './'

import { ivm, Context } from '../'
import log from "../log"

registerBridge('getHeapStatistics', function (ctx: Context) {
  return function (callback: ivm.Reference<Function>) {
    ctx.addCallback(callback)
    ctx.iso.getHeapStatistics().then((heap) => {
      ctx.tryCallback(callback, [null, new ivm.ExternalCopy(heap).copyInto()])
    }).catch((err) => {
      ctx.tryCallback(callback, [err.toString()])
    })
  }
})