import { registerBridge } from './'

import { ivm } from '../'
import { Runtime } from '../runtime';

registerBridge('getHeapStatistics', function (rt: Runtime) {
  return function (cb: ivm.Reference<Function>) {
    rt.isolate.getHeapStatistics().then((heap) => {
      cb.applyIgnored(null, [null, new ivm.ExternalCopy(heap).copyInto()])
    }).catch((err) => {
      cb.applyIgnored(null, [err.toString()])
    })
  }
})