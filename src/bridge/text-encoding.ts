import log from '../log'

import { ivm } from '..';

import { registerBridge } from '.';
import { Context } from '../context';
import { Bridge } from './bridge';

import { TextEncoder, TextDecoder } from 'util'
import { transferInto } from '../utils/buffer';

registerBridge("TextDecoder.decode", async function (ctx: Context, bridge: Bridge) {
  const tdp = new TextDecoderProxy
  return new ivm.Reference(tdp.decode.bind(tdp))
})

registerBridge("TextEncoder.encode", async function (ctx: Context, bridge: Bridge) {
  const tep = new TextEncoderProxy
  return new ivm.Reference(tep.encode.bind(tep))
})

class TextDecoderProxy {
  td: TextDecoder
  constructor() {
    this.td = new TextDecoder()
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