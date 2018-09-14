import { ivm } from '..';

import { registerBridge } from '.';
import { Bridge } from './bridge';
import { createHash, Hash, HexBase64Latin1Encoding, randomBytes } from 'crypto';

import { transferInto } from '../utils/buffer';
import { Runtime } from '../runtime';

registerBridge("digestHash", function (rt: Runtime, bridge: Bridge, algo: string, data: ArrayBuffer | string, encoding?: HexBase64Latin1Encoding) {
  return digestHash(algo, data, encoding)
})

registerBridge("digestHashAsync", function (rt: Runtime, bridge: Bridge, algo: string, data: ArrayBuffer | string, encoding?: HexBase64Latin1Encoding) {
  try {
    let h = digestHash(algo, data, encoding)
    return Promise.resolve(h)
  } catch (e) {
    return Promise.reject(e)
  }
})

registerBridge("getRandomValues", function (rt: Runtime, bridge: Bridge, bufLen: number) {
  return new Promise<ivm.Copy<ArrayBuffer> | null>((resolve, reject) => {
    if (bufLen > 65536) {
      return reject(new Error('Failed to execute \'getRandomValues\' on \'Crypto\': The ' +
        'ArrayBufferView\'s byte length (' + bufLen + ') exceeds the ' +
        'number of bytes of entropy available via this API (65536).'))
    }
    resolve(transferInto(randomBytes(bufLen)))
  })
})

function digestHash(algo: string, data: ArrayBuffer | string, encoding?: HexBase64Latin1Encoding) {
  let h: Hash
  h = createHash(algo.replace('-', ''))
  h.update(typeof data === 'string' ? data : Buffer.from(data))
  if (!encoding)
    return transferInto(h.digest())
  return h.digest(encoding)
}
