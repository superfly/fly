/**
 * @module fly
 * @private
 */
import { stringify } from "querystring"

/**
 * Class representing a fetch response.
 * @hidden
 */
export default class FormData {
  private _data: Map<string, string[]>

  constructor() {
    this._data = new Map<string, string[]>()
  }

  public append(name: string, value: string) {
    let vals: string[]
    const currentVals = this._data.get(name)
    if (currentVals === undefined) {
      vals = [value]
    } else {
      vals = currentVals.concat([value])
    }
    this._data.set(name, vals)
  }

  public delete(name: string) {
    this._data.delete(name)
  }

  public entries(): IterableIterator<[string, string[]]> {
    return this._data.entries()
  }

  public get(name: string): string | null {
    const vals = this._data.get(name)
    if (vals === undefined) {
      return null
    }
    return vals[0]
  }

  public getAll(name: string): string[] {
    const vals = this._data.get(name)
    if (vals === undefined) {
      return []
    }
    return vals
  }

  public has(name: string): boolean {
    return this._data.has(name)
  }

  public keys(): IterableIterator<string> {
    return this._data.keys()
  }

  public set(name: string, value: string) {
    this._data.set(name, [value])
  }

  public values(): IterableIterator<string> {
    // this._data.values() doesn't flatten arrays of arrays
    const that = this
    return (function*() {
      for (const vals of that._data.values()) {
        if (Array.isArray(vals)) {
          for (const val of vals) {
            yield val
          }
        } else {
          yield vals
        }
      }
    })()
  }

  public toString(): string {
    const output: string[] = []
    this._data.forEach((value, key) => {
      output.push(stringify({ [`${key}`]: value }))
    })
    return output.join("&")
  }
}
