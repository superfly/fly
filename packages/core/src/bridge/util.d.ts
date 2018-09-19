/// <reference types="node" />

type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array

declare module "util" {
  export interface TextDecoderOptions {
    fatal?: boolean
    ignoreBOM?: boolean
  }
  export interface DecodeOptions {
    stream?: boolean
  }
}
