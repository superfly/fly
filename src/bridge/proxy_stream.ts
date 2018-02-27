import { registerBridge } from './'
import { Readable } from "stream";
import { ivm, Config, Context } from "../";
import { transferInto } from "../utils/buffer";

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
  ended: boolean
  private _ref: ivm.Reference<ProxyStream> | undefined

  constructor(base: Readable) {
    this.ended = false
    this.stream = base
    this.buffered = []
    this.stream.on("close", ()=> this.ended = true)
    this.stream.on("end", ()=> this.ended = true)
    this.stream.on("error", ()=> this.ended = true)
  }

  get ref() {
    if (!this._ref) {
      this._ref = new ivm.Reference<ProxyStream>(this)
    }
    return this._ref
  }
}

registerBridge("subscribeProxyStream", function (ctx: Context, config: Config, ref: ivm.Reference<ProxyStream>, cb: ivm.Reference<Function>) {
  ctx.addCallback(cb)
  const proxyable = ref.deref({ release: true })
  const stream = proxyable.stream
  if (!stream) {
    ctx.applyCallback(cb, ["end"])
    return
  }
  stream.on("close", function () {
    ctx.applyCallback(cb, ["close"])
  })
  stream.on("end", function () {
    ctx.applyCallback(cb, ["end"])
  })
  stream.on("error", function (err: Error) {
    ctx.applyCallback(cb, ["error", err.toString()])
  })
  /*stream.on("data", function (data: Buffer) {
    console.log("data length:", data.length, stream.isPaused())
    proxyable.buffered.push(data)
    console.log("Buffer length: ", proxyable.buffered.length)
    ctx.applyCallback(cb, ["data", transferInto(data)])
  })*/
  //setImmediate(() => stream.resume())
})
registerBridge("readProxyStream", function(ctx: Context, config: Config, ref: ivm.Reference<ProxyStream>, cb: ivm.Reference<Function>){
  ctx.addCallback(cb)
  const proxyable = ref.deref({ release: true })
  const stream = proxyable.stream

  let attempts = 0
  const tryRead = function(){
    attempts += 1
    let chunk = stream.read(1024 * 1024)
    let length = -1
    if(chunk) length = chunk.byteLength

    if(chunk){
      proxyable.buffered.push(chunk)
      chunk = transferInto(chunk)
    }
    if(chunk || attempts >= 10 || proxyable.ended){
      ctx.applyCallback(cb, [null, chunk])
    }else{
      // wait a bit, with a backoff
      setTimeout(tryRead, 20 * attempts)
    }
  }
  setImmediate(tryRead)

})