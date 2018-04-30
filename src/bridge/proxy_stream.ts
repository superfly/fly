import { registerBridge } from './'
import { Readable } from "stream";
import { ivm, Context } from "../";
import { transferInto } from "../utils/buffer";
import { Bridge } from './bridge';

// get stream from http or whatever
// pass reference back to v8
//   * v8 optionally reads stream
// pass reference from v8 -> node
//   * cache set
//   * returned response
// once stream is read, it's dirty
//   * if we're only reading from within node, we should handle this
//   * can pipe it to both cache and http response

export class ProxyStream {
  stream: Readable
  buffered: Buffer[]
  bufferedByteLength: number
  readLength: number
  tainted: boolean
  ended: boolean
  private _ref: ivm.Reference<ProxyStream> | undefined

  constructor(base: Readable) {
    this.tainted = false
    this.ended = false
    this.stream = base
    this.buffered = []
    this.bufferedByteLength = 0
    this.readLength = 0
    this.stream.once("close", () => this.ended = true)
    this.stream.once("end", () => this.ended = true)
    this.stream.once("error", () => this.ended = true)
  }

  read(size?: number): Buffer | null {
    let chunk = this.stream.read(size)
    if (chunk && !this.tainted) this.bufferChunk(chunk)
    if (chunk)
      this.readLength += Buffer.byteLength(chunk)
    return chunk
  }

  bufferChunk(chunk: Buffer): boolean {
    if (this.tainted) return false
    this.bufferedByteLength += chunk.byteLength
    if (this.bufferedByteLength > 10 * 1024 * 1024) {
      // no longer buffering, can't be used
      this.tainted = true
      this.buffered = []
      this.bufferedByteLength = 0
    } else {
      this.buffered.push(chunk)
    }
    return !this.tainted
  }

  get ref() {
    if (!this._ref) {
      this._ref = new ivm.Reference<ProxyStream>(this)
    }
    return this._ref
  }
}

registerBridge("subscribeProxyStream", function (ctx: Context, bridge: Bridge, ref: ivm.Reference<ProxyStream>, cb: ivm.Reference<Function>) {
  ctx.addReleasable(cb)
  const proxyable = ref.deref({ release: true })
  const stream = proxyable.stream
  if (!stream) {
    ctx.tryCallback(cb, ["end"])
    return
  }
  stream.once("close", streamClose)
  stream.once("end", streamEnd)
  stream.on("error", streamError)

  function streamClose() {
    ctx.tryCallback(cb, ["close"])
    stream.removeAllListeners()
  }
  function streamEnd() {
    ctx.tryCallback(cb, ["end"])
  }
  function streamError(err: Error) {
    ctx.tryCallback(cb, ["error", err.toString()])
  }
})

registerBridge("readProxyStream", function (ctx: Context, bridge: Bridge, ref: ivm.Reference<ProxyStream>, cb: ivm.Reference<Function>) {
  const proxyable = ref.deref({ release: true })

  let attempts = 0
  const tryRead = function () {
    attempts += 1
    let chunk = proxyable.read(1024 * 1024)
    let data: ivm.Copy<ArrayBuffer> | null = null
    if (chunk) {
      data = transferInto(chunk)
    }
    ctx.addCallback(cb)
    if (data || attempts >= 10 || proxyable.ended) {
      ctx.applyCallback(cb, [null, data, proxyable.tainted])
    } else if (attempts >= 10 && !proxyable.ended) {
      // wait a bit, with a backoff
      setTimeout(tryRead, 20 * attempts)
    } else {
      ctx.applyCallback(cb, [null, null, proxyable.tainted])
    }
  }
  setImmediate(tryRead)
})