import { transferInto } from "./utils/buffer";

let newTextDecoder,
  textDecode,
  newTextEncoder,
  textEncode;

export class TextEncoder {
  constructor() {
    this._encode = newTextEncoder()
  }
  encode(input) {
    return textEncode(this._encode, input)
  }
}

export class TextDecoder {
  constructor() {
    this._decode = newTextDecoder()
  }
  decode(input) {
    return textDecode(this._decode, input)
  }
}

export default function textEncodingInit(ivm, dispatcher) {
  newTextDecoder = function newTextDecoder() {
    const ref = dispatcher.dispatchSync("TextDecoder.decode")
    finalizers.push(ref.release)
    return ref
  }
  textDecode = function textDecode(ref, input) {
    return ref.applySyncPromise(null, [transferInto(ivm, input)])
  }

  newTextEncoder = function newTextEncoder(encoding) {
    const ref = dispatcher.dispatchSync("TextEncoder.encode", encoding)
    finalizers.push(ref.release)
    return ref
  }
  textEncode = function textEncode(ref, input) {
    return ref.applySyncPromise(null, [input])
  }

  return {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder
  }
}