/// <reference types="node" />

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;

declare module 'util' {
  export interface TextDecoderOptions {
    fatal?: boolean
    ignoreBOM?: boolean
  }
  export interface DecodeOptions {
    stream?: boolean
  }
  export class TextDecoder {
    constructor(encoding?: string, options?: TextDecoderOptions)
    decode(input: ArrayBuffer | DataView | TypedArray, options?: DecodeOptions): string

    encoding: string
    fatal: boolean
    ignoreBOM: boolean
  }

  export class TextEncoder {
    constructor()
    encode(input?: string): Uint8Array
    encoding: string
  }
}