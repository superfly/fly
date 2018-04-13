import { registerBridge } from '../'
import { ivm } from '../../'
import { Trace } from '../../trace'
import { Context } from '../../'
import { transferInto } from '../../utils/buffer'

import Fontmin = require('fontmin');
import { Bridge } from '../bridge';
import * as fs from 'fs';

registerBridge("fly.Font()", function fontConstructor(ctx: Context, bridge: Bridge, data: ivm.Reference<Buffer>) {
  try {
    if (!(data instanceof ArrayBuffer))
      throw new Error("font data must be an ArrayBuffer")
    const font = new Fontmin().src(toBuffer(data))
    const ref = new ivm.Reference(font)
    ctx.addReleasable(ref)
    return Promise.resolve(ref)
  } catch (e) {
    return Promise.reject(e)
  }
})

registerBridge('fly.Font.layout', async function layout(ctx: Context, bridge: Bridge, ref: ivm.Reference<Fontmin>, characters: string) {
  try {
    const font = refToFont(ref)
    font.dest('/Users/zoe/Developer/fly/apps/font-example')
    font.use(Fontmin.glyph({text: characters}))
    font.use(Fontmin.ttf2woff({}));
    const buffer = await woffStringFromRun(font)
    return Promise.resolve(buffer)
  } catch (err) {
    return Promise.reject(err)
  }
})

function refToFont(ref: ivm.Reference<Fontmin>) {
  const font = ref.deref()
  if (!font)
    throw new Error("ref must be a valid font instance")
  return font
}

/** @hidden */
function woffStringFromRun(font: any): Promise<string> {
  return new Promise((resolve, reject) => {
    font.run((error:any, files:any[], stream:any) => {
      if (error) reject(error)
      const contents = fs.readFileSync(files[0].stem + '.woff', 'binary')
      fs.writeFileSync('font.woff', contents, 'binary')
      resolve(contents)
    })
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
