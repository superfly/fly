/**
 * @module fly
 * @private
 */
declare var bridge: any

export class TextEncoder {
  public encode(input) {
    return bridge.dispatchSync("TextEncoder.encode", input)
  }
}

export class TextDecoder {
  public encoding: any
  constructor(encoding) {
    this.encoding = encoding
  }
  public decode(input) {
    if (!input) return ""
    return bridge.dispatchSync("TextDecoder.decode", input, this.encoding)
  }
}
