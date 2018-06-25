import log from '../log'

import { ivm } from '..';

import { registerBridge } from '.';
import { Context } from '../context';
import { Bridge } from './bridge';

import { TextEncoder, TextDecoder } from 'util'
import { transferInto } from '../utils/buffer';

registerBridge("TextDecoder.decode", async function (ctx: Context, bridge: Bridge, buf: ArrayBuffer, encoding?: string) {
  console.log("Decoding buffer:", encoding, buf.byteLength)
  //const txt = await new TextDecoderProxy(encoding).decode(buf)
  const txt2 = Buffer.from(buf).toString(encoding)
  //console.log("Got string:", txt.length, txt2.length, txt == txt2, txt[txt.length - 1], txt2[txt2.length - 1])
  return txt2
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