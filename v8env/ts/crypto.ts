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
  },
  getRandomValues(typedArray: Uint8Array): void {
    if (!(typedArray instanceof Uint8Array)) {
      throw new Error("Only Uint8Array are supported at present")
    }
    const newArr = new Uint8Array(bridge.dispatchSync("getRandomValues", typedArray.length))
    typedArray.set(newArr)
    return
  }
}