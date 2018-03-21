import { Dispatcher } from "./types/dispatcher";

import { transferInto } from './utils/buffer';

type CryptoData = BufferSource | string

let digestHash: (algo: string, data: CryptoData, encoding?: string) => Promise<ArrayBuffer | string>
let digestHashSync: (algo: string, data: CryptoData, encoding?: string) => ArrayBuffer | string

export default function cryptoInit(ivm: any, dispatcher: Dispatcher) {
  digestHash = async function (algo: string, data: CryptoData, encoding?: string): Promise<ArrayBuffer | string> {
    return dispatcher.dispatch("digestHash", algo, typeof data === 'string' ? data : transferInto(ivm, data), encoding)
  }

  digestHashSync = function (algo: string, data: CryptoData, encoding?: string): ArrayBuffer | string {
    return dispatcher.dispatchSync("digestHashAsync", algo, typeof data === 'string' ? data : transferInto(ivm, data), encoding)
  }
}

export const crypto = {
  subtle: {
    digest(algo: string, buf: CryptoData, encoding?: string) {
      return digestHash(algo, buf, encoding)
    },
    digestSync(algo: string, buf: CryptoData, encoding?: string) {
      return digestHashSync(algo, buf, encoding)
    }
  }
}