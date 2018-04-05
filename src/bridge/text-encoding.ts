import log from '../log'

import { ivm } from '..';

import { registerBridge } from '.';
import { Context } from '../context';
import { Bridge } from './bridge';

import { TextEncoder, TextDecoder } from 'util'
import { transferInto } from '../utils/buffer';

registerBridge("TextDecoder.decode", async function (ctx: Context, bridge: Bridge, buf: ArrayBuffer, encoding?: string) {
  return new TextDecoderProxy(encoding).decode(buf)
})

registerBridge("TextEncoder.encode", async function (ctx: Context, bridge: Bridge, data: string) {
  return new TextEncoderProxy().encode(data)
})

class TextDecoderProxy {
  td: TextDecoder
  constructor(encoding?: string) {
    this.td = new TextDecoder(encoding)
  }

  async decode(input: ArrayBuffer | DataView | TypedArray) {
    return this.td.decode(input)
  }
}

class TextEncoderProxy {
  te: TextEncoder
  constructor() {
    this.te = new TextEncoder()
  }
  async encode(input: string) {
    return transferInto(this.te.encode(input))
  }
}