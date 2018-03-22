import { transferInto } from "./utils/buffer";

let textDecode,
  textEncode;

export class TextEncoder {
  constructor() { }
  encode(input) {
    return textEncode(input)
  }
}

export class TextDecoder {
  constructor(encoding) { this.encoding = encoding }
  decode(input) {
    return textDecode(input, this.encoding)
  }
}

export default function textEncodingInit(ivm, dispatcher) {
  textDecode = function textDecode(input, encoding) {
    return dispatcher.dispatchSync("TextDecoder.decode", transferInto(ivm, input), encoding)
  }

  textEncode = function textEncode(input) {
    return dispatcher.dispatchSync("TextEncoder.encode", input)
  }

  return {
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder
  }
}