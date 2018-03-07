import { registerBridge } from '../'
import { ivm } from '../../'
import { Trace } from '../../trace'
import { Config, Context } from '../../'
import { transferInto } from '../../utils/buffer'

import log from "../../log"

import * as sharp from 'sharp'

interface sharpImage extends sharp.SharpInstance{
  options: any
}

interface imageOperation{
  (...args:any[]): sharp.SharpInstance
}
const allowedOperations:Map<string, imageOperation> = new Map([
  ["resize", sharp.prototype.resize],
  ["withMetadata", sharp.prototype.withMetadata],
  ["png", sharp.prototype.png],
  ["webp", sharp.prototype.webp]
])

registerBridge('flyModifyImage', function imageOperation(ctx: Context, config: Config, data: ivm.Reference<Buffer>, ops: any[], callback: ivm.Reference<Function>){
  let t = Trace.tryStart("modifyImage", ctx.trace)
  ctx.addCallback(callback)
  if(!(data instanceof ArrayBuffer)){
    ctx.applyCallback(callback, ["image must be an ArrayBuffer"])
    return
  }else{
    log.debug("data is arraybuffer")
  }
  log.debug("flyModifyImage:", data.byteLength)

  let image: sharpImage
  let originalInfo: any
  try{
    image = <sharpImage>sharp(Buffer.from(data))
  }catch(err){
    ctx.applyCallback(callback, ["Error reading image buffer: " + err.toSring()])
    return
  }
  try{
    for(const o of ops){
      const operation = allowedOperations.get(o.name)
      if(operation){
        image = operation.apply(image, o.args)
      }else{
          throw new Error("Invalid image operation: " + o.name)
      }
    }
  }catch(err){
    ctx.applyCallback(callback, [err.toString()])
    return 
  }

  const inSize = data.byteLength
  image.toBuffer((err, d, info) => {
    if(err){
      log.debug("sending error:", err)
      ctx.applyCallback(callback, [err.toString()])
      return
    }
    t.end({operations: ops.length, output: info.format, inSize: inSize, outSize: d.byteLength})
    ctx.applyCallback(callback, [null, transferInto(d), new ivm.ExternalCopy(info).copyInto({release: true})])
  })
})

