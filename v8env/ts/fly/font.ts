/**
 * @module fly
 */
import { transferInto } from "../utils/buffer";
export class Font {
  /** @hidden */
  private _ref: any
  /** @hidden */
  private font?: any
  /**
   * Constructs a new Font from raw Buffer data
   * @param data Raw font data from `fetch` or `cache` or somewhere else.
   */
  constructor(data: ArrayBuffer) {
    console.log('making font')
    if (!(data instanceof ArrayBuffer))
      throw new Error("Data must be an ArrayBuffer")
    this._ref = constructFont(data)
  }

  async subset(characters:string) {
    return await this._layout(characters)
  }

  /** @hidden */
  private _layout(characters: string) {
    if (!layout)
      throw new Error("Font operations not enabled")

    return layout(this._ref, characters)
  }
}

/**
 * @hidden
 */
let constructFont: (data: ArrayBuffer, options?: any) => any
/**
 * @hidden
 */
let layout: (ref: any, name: string, ...args: any[]) => any
export default function initFont(ivm: any, dispatcher: any) {
  constructFont = function (data: ArrayBuffer) {
    return dispatcher.dispatchSync("fly.Font()", transferInto(ivm, data))
  }

  layout = function (ref: any, characters: string) {
    return dispatcher.dispatchSync("fly.Font.layout", ref, characters)
  }

  return Font
}
