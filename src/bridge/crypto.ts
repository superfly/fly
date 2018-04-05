import log from '../log'

import { ivm } from '..';

import { registerBridge } from '.';
import { Context } from '../context';
import { Bridge } from './bridge';
import { createHash, Hash, HexBase64Latin1Encoding } from 'crypto';

import { transferInto } from '../utils/buffer';

const supportedAlgos = ["blake2b512", "blake2s256", "gost", "md4", "md5", "mdc2", "rmd160", "sha1", "sha224", "sha256", "sha384", "sha512"]

registerBridge("digestHash", function (ctx: Context, bridge: Bridge, algo: string, data: ArrayBuffer | string, encoding?: HexBase64Latin1Encoding) {
  return digestHash(algo, data, encoding)
})

registerBridge("digestHashAsync", function (ctx: Context, bridge: Bridge, algo: string, data: ArrayBuffer | string, encoding?: HexBase64Latin1Encoding) {
  try {
    let h = digestHash(algo, data, encoding)
    return Promise.resolve(h)
  } catch (e) {
    return Promise.reject(e)
  }
})

function digestHash(algo: string, data: ArrayBuffer | string, encoding?: HexBase64Latin1Encoding) {
  let h: Hash
  h = createHash(algo.replace('-', ''))
  h.update(typeof data === 'string' ? data : Buffer.from(data))
  if (!encoding)
    return transferInto(h.digest())
  return h.digest(encoding)
}
