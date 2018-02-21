import { registerBridge, Context } from './'
import { Readable } from "stream";
import { ivm } from "../";
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

export class ProxyStream{
  stream: Readable
  private _ref:ivm.Reference<ProxyStream> | undefined

  constructor(base:Readable){
    this.stream = base
  }

  get ref(){
    if(!this._ref){
      this._ref = new ivm.Reference<ProxyStream>(this)
    }
    return this._ref
  }
}

registerBridge("readProxyStream", function(ctx){
  return function(ref: ivm.Reference<ProxyStream>, cb: ivm.Reference<Function>){
    const proxyable = ref.deref()
    const stream = proxyable.stream
    if(!stream){
      cb.apply(undefined, ["end"])
      return
    }
    stream.on("close", function(){
      cb.apply(undefined, ["close"])
    })
    stream.on("end", function () {
      cb.apply(undefined, ["end"])
    })
    stream.on("error", function (err: Error) {
      cb.apply(undefined, ["error", err.toString()])
    })
    stream.on("data", function (data: Buffer) {
      cb.apply(undefined, ["data", transferInto(data)])
    })
    setImmediate(()=> stream.resume())
  }
})