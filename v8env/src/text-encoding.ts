
declare var bridge: any

export class TextEncoder {
  constructor() { }
  encode(input) {
    return bridge.dispatchSync("TextEncoder.encode", input)
  }
}

export class TextDecoder {
  encoding: any
  constructor(encoding) { this.encoding = encoding }
  decode(input) {
    return bridge.dispatchSync("TextDecoder.decode", input, this.encoding)
  }
}