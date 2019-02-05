import { registerBridge } from "../"
import { ivm } from "../../"
import { transferInto } from "../../utils/buffer"

import log from "../../log"

import * as sharp from "sharp"
import { Bridge } from "../bridge"
import { Runtime } from "../../runtime"

type imageOperation = (...args: any[]) => sharp.Sharp

const allowedOperations: Map<string, imageOperation> = new Map([
  ["resize", sharp.prototype.resize],
  ["scale", scale],
  ["crop", crop],
  ["embed", sharp.prototype.embed],
  ["background", sharp.prototype.background],
  ["withoutEnlargement", sharp.prototype.withoutEnlargement],
  ["withMetadata", sharp.prototype.withMetadata],

  ["overlayWith", sharp.prototype.overlayWith],
  ["negate", sharp.prototype.negate],
  ["max", sharp.prototype.max],
  ["extend", sharp.prototype.extend],
  ["flatten", sharp.prototype.flatten],

  // output
  ["png", sharp.prototype.png],
  ["webp", sharp.prototype.webp],
  ["jpeg", sharp.prototype.jpeg]
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

registerBridge("fly.Image()", function imageConstructor(
  rt: Runtime,
  bridge: Bridge,
  data?: ivm.Reference<Buffer>,
  create?: any
) {
  try {
    if (data && !(data instanceof ArrayBuffer)) {
      throw new Error("image data must be an ArrayBuffer")
    }
    const opts: any = {}
    if (create) {
      if (typeof create.background === "string") {
        // create.background = color.parse(create.background)
      }
      opts.create = create
    }
    const image = sharp(data && Buffer.from(data), opts)
    const ref = new ivm.Reference(image)
    return Promise.resolve(ref)
  } catch (e) {
    return Promise.reject(e)
  }
})

registerBridge(
  "fly.Image.operation",
  (rt: Runtime, bridge: Bridge, ref: ivm.Reference<sharp.Sharp>, name: string, ...args: any[]) => {
    try {
      const originalImage = refToImage(ref)
      let img = originalImage
      const operation = allowedOperations.get(name)

      if (!operation) {
        throw new Error("Invalid image operation: " + name)
      }

      for (let i = 0; i < args.length; i++) {
        const v = args[i]
        // replace image references with `toBuffer` promises
        if (v instanceof ivm.Reference) {
          const imgRef = refToImage(v)
          args[i] = imgRef.toBuffer()
        }
      }
      return new Promise((resolve, reject) => {
        // resolve any promise arguments
        Promise.all(args)
          .then(async resolvedArgs => {
            for (let i = 0; i < resolvedArgs.length; i++) {
              const v = resolvedArgs[i]
              // and convert ArrayBuffers
              if (v instanceof ArrayBuffer) {
                resolvedArgs[i] = Buffer.from(v)
              }
            }
            img = operation.apply(img, resolvedArgs)
            if (img instanceof Promise) {
              img = await img
            }
            if (img !== originalImage) {
              const oldref = ref
              ref = new ivm.Reference(img)
              oldref.release()
            }
            resolve(ref)
          })
          .catch(reject)
      })
    } catch (err) {
      return Promise.reject(err)
    }
  }
)

registerBridge("fly.Image.metadata", async function imageMetadata(
  rt: Runtime,
  bridge: Bridge,
  ref: ivm.Reference<sharp.Sharp>
) {
  const img = ref.deref()
  const meta = await img.metadata()
  return new ivm.ExternalCopy(extractMetadata(meta)).copyInto({ release: true })
})

registerBridge("fly.Image.toBuffer", function imageToBuffer(
  rt: Runtime,
  bridge: Bridge,
  ref: ivm.Reference<sharp.Sharp>,
  callback: ivm.Reference<(...args: any[]) => void>
) {
  const img = refToImage(ref)
  if (!img) {
    callback.applyIgnored(null, ["ref must be a valid image instance"])
    return
  }

  img.toBuffer((err, d, metadata) => {
    if (err) {
      log.debug("sending error:", err)
      callback.applyIgnored(null, [err.toString()])
      return
    }
    const info = extractMetadata(metadata)
    callback.applyIgnored(null, [null, transferInto(d), new ivm.ExternalCopy(info).copyInto({ release: true })])
  })
})

function refToImage(ref: ivm.Reference<sharp.Sharp>) {
  const img = ref.deref()
  if (!img) {
    throw new Error("ref must be a valid image instance")
  }

  return img
}

async function scale(this: sharp.Sharp, ...args: any[]) {
  const opts = typeof args[args.length - 1] === "object" ? args[args.length - 1] : undefined
  const sharpOpts = {
    kernel: sharp.kernel.lanczos3,
    fastShrinkOnLoad: true
  }
  const fit = opts && opts.fit

  if (opts) {
    sharpOpts.kernel = opts.kernel
    sharpOpts.fastShrinkOnLoad = opts.fastShrinkOnLoad
  }

  let width = typeof args[0] === "number" ? args[0] : undefined
  let height = typeof args[1] === "number" ? args[1] : undefined
  const ignoreAspectRatio = typeof opts === "object" && opts.ignoreAspectRatio === true
  const withoutEnlargement = typeof opts === "object" && opts.allowEnlargement === false

  if (!width || !height) {
    const meta = await this.metadata()
    if (!width && height) {
      width = relativeDimension(width, meta.width || 0, height, meta.height || 0)
    }
    if (!height && width) {
      height = relativeDimension(height, meta.height || 0, width, meta.width || 0)
    }
  }

  let img = this
  img = img.resize(width, height, sharpOpts)

  if (withoutEnlargement) {
    img = (img as any).withoutEnlargement()
  }
  if (ignoreAspectRatio === true || fit === "fill") {
    img = (img as any).ignoreAspectRatio()
  } else if (fit === "cover") {
    img = (img as any).min()
  } else {
    img = (img as any).max()
  }

  return img
}

async function crop(this: sharp.Sharp, width?: number, height?: number, opts?: any) {
  let img = this
  if (width || height) {
    const meta = await this.metadata()
    if (!width && height) {
      width = relativeDimension(width, meta.width || 0, height, meta.height || 0)
    }
    if (!height && width) {
      height = relativeDimension(height, meta.height || 0, width, meta.width || 0)
    }
    img = this.resize(width, height)
  }
  return (img as any).crop(opts)
}

function relativeDimension(x: number | undefined, original: number, other: number, basis: number) {
  if (x && typeof x === "number" && !isNaN(x)) {
    return x
  }

  const scaleVal = other / basis

  return Math.ceil(scaleVal * original)
}
