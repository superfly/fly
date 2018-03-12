import { registerBridge } from '../'
import { ivm } from '../../'
import { Trace } from '../../trace'
import { Context } from '../../'
import { transferInto } from '../../utils/buffer'

import log from "../../log"

import * as sharp from 'sharp'
import { Bridge } from '../bridge';

interface sharpImage extends sharp.SharpInstance {
  options: any
}

interface imageOperation {
  (...args: any[]): sharp.SharpInstance
}

const allowedOperations: Map<string, imageOperation> = new Map([
  ["resize", sharp.prototype.resize],
  ["crop", sharp.prototype.crop],
  ["embed", sharp.prototype.embed],
  ["background", sharp.prototype.background],
  ["withoutEnlargement", sharp.prototype.withoutEnlargement],
  ["withMetadata", sharp.prototype.withMetadata],
  ["png", sharp.prototype.png],
  ["webp", sharp.prototype.webp]
])

const metadataFields = [
  "format",
  "width",
  "height",
  "number",
  "space",
  "channels",
  "density",
  "hasProfile",
  "hasAlpha",
  "orientation"
]

interface Metadata {
  [key: string]: any
}
function extractMetadata(meta: any): any {
  const info: Metadata = {}
  for (const f of metadataFields) {
    info[f] = meta[f]
  }
  return info
}
registerBridge('flyImageMetadata', function imageMetadata(ctx: Context, bridge: Bridge, data: ivm.Reference<Buffer>, callback: ivm.Reference<Function>) {
  let t = Trace.tryStart("imageMetadata", ctx.trace)
  ctx.addCallback(callback)
  if (!(data instanceof ArrayBuffer)) {
    ctx.applyCallback(callback, ["image must be an ArrayBuffer"])
    return
  }

  let image: sharpImage
  try {
    image = <sharpImage>sharp(Buffer.from(data))
  } catch (err) {
    ctx.applyCallback(callback, ["Error reading image buffer: " + err.toSring()])
    return
  }

  image.metadata((err, metadata) => {
    if (err) {
      ctx.applyCallback(callback, [err.toString()])
      return
    }
    const info = extractMetadata(metadata)
    t.end({ size: data.byteLength, width: metadata.width, height: metadata.height })
    ctx.applyCallback(callback, [null, new ivm.ExternalCopy(info).copyInto({ release: true })])
  })
})
registerBridge('flyModifyImage', function imageOperation(ctx: Context, bridge: Bridge, data: ivm.Reference<Buffer>, ops: any[], callback: ivm.Reference<Function>) {
  let t = Trace.tryStart("modifyImage", ctx.trace)
  ctx.addCallback(callback)
  if (!(data instanceof ArrayBuffer)) {
    ctx.applyCallback(callback, ["image must be an ArrayBuffer"])
    return
  }

  let image: sharpImage
  let originalInfo: any
  try {
    image = <sharpImage>sharp(Buffer.from(data))
  } catch (err) {
    ctx.applyCallback(callback, ["Error reading image buffer: " + err.toSring()])
    return
  }
  try {
    for (const o of ops) {
      const operation = allowedOperations.get(o.name)
      if (operation) {
        image = operation.apply(image, o.args)
      } else {
        throw new Error("Invalid image operation: " + o.name)
      }
    }
  } catch (err) {
    ctx.applyCallback(callback, [err.toString()])
    return
  }

  const inSize = data.byteLength
  image.toBuffer((err, d, metadata) => {
    if (err) {
      log.debug("sending error:", err)
      ctx.applyCallback(callback, [err.toString()])
      return
    }
    const info = extractMetadata(metadata)
    t.end({ operations: ops.length, output: info.format, inSize: inSize, outSize: d.byteLength })
    ctx.applyCallback(callback, [null, transferInto(d), new ivm.ExternalCopy(info).copyInto({ release: true })])
  })
})

