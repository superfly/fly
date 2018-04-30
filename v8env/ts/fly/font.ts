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
    if (!(data instanceof ArrayBuffer))
      throw new Error("Data must be an ArrayBuffer")
    this._ref = constructFont(data)
  }

  async subset(characters:string, fontType:string = 'woff') {
    return await this._layout(characters, fontType)
  }

  /** @hidden */
  private _layout(characters: string, fontType:string) {
    if (!layout)
      throw new Error("Font operations not enabled")

    return layout(this._ref, characters, fontType)
  }
}

/**
 * @hidden
 */
let constructFont: (data: ArrayBuffer, options?: any) => any
/**
 * @hidden
 */
let layout: (ref: any, characters:string, fontType:string) => any
export default function initFont(ivm: any, dispatcher: any) {
  constructFont = function (data: ArrayBuffer) {
    return dispatcher.dispatchSync("fly.Font()", transferInto(ivm, data))
  }

  layout = function (ref: any, characters: string, fontType: string) {
    return dispatcher.dispatchSync("fly.Font.layout", ref, characters, fontType)
  }

  return Font
}
