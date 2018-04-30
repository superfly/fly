/**
 * @private
 * @module fly
 * @hidden
 */
type CryptoData = BufferSource | string

/** @hidden */
export const crypto = {
  subtle: {
    digest(algo: string, data: CryptoData, encoding?: string): Promise<ArrayBuffer | string> {
      return bridge.dispatch("digestHash", algo, data, encoding)
    },
    digestSync(algo: string, data: CryptoData, encoding?: string): ArrayBuffer | string {
      return bridge.dispatchSync("digestHashAsync", algo, data, encoding)
    }
  }
}