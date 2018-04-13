import { registerBridge } from '../'
import { ivm } from '../../'
import { Trace } from '../../trace'
import { Context } from '../../'
import { transferInto } from '../../utils/buffer'

import * as fontkit from 'fontkit';
import { Bridge } from '../bridge';
import { Readable } from 'stream';

interface fontkit {
  (...args: any[]): fontkit.Font
}

const allowedOperations: Map<string, fontkit> = new Map([
  ["create", fontkit.create],
])

registerBridge("fly.Font()", function fontConstructor(ctx: Context, bridge: Bridge, data: ivm.Reference<Buffer>) {
  try {
    if (!(data instanceof ArrayBuffer)) {
      throw new Error("font data must be an ArrayBuffer")
    }
    const font = fontkit.create(Buffer.from(data))
    const ref = new ivm.Reference(font)
    ctx.addReleasable(ref)
    return Promise.resolve(ref)
  } catch (e) {
    return Promise.reject(e)
  }
})

registerBridge('fly.Font.layout', async function layout(ctx: Context, bridge: Bridge, ref: ivm.Reference<fontkit.Font>, characters: string) {
  try {
    const font = refToFont(ref)
    const set = font.layout(characters)
    const subset = font.createSubset()
    set.glyphs.forEach((glyph:any) => subset.includeGlyph(glyph))
    const buffer = await stringFromStream(subset.encodeStream())
    return Promise.resolve(buffer)
  } catch (err) {
    return Promise.reject(err)
  }
})

function refToFont(ref: ivm.Reference<fontkit.Font>) {
  const font = ref.deref()
  if (!font)
    throw new Error("ref must be a valid font instance")
  return font
}

/** @hidden */
function stringFromStream(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let out:string = ''
    try {
      stream.on('readable', () => {
        out += stream.read()
      })
      stream.on('end', () => {
        resolve(out)
      })
    } catch (err) {
      reject(err)
    }
  })
}

/** @hidden */
function concatenate(...arrays: Uint8Array[]): ArrayBuffer {
  let totalLength = 0;
  for (let arr of arrays) {
    totalLength += arr.length;
  }
  let result = new Uint8Array(totalLength);
  let offset = 0;
  for (let arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return <ArrayBuffer>result.buffer;
}

/** @hidden */
function toBuffer(ab:ArrayBuffer) {
    var buf = new Buffer(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}
