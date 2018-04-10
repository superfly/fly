/**
 * A class for modifying images. This uses operations from [Sharp](http://sharp.pixelplumbing.com/en/stable/) under the hood.
 * @module fly
 */
import { transferInto } from "../utils/buffer";
export class Image {
  /** @hidden */
  data: ArrayBuffer
  /** @hidden */
  info: Image.Metadata | null

  /** @hidden */
  private _ref: any

  /**
   * Constructs a new Image from raw Buffer data
   * @param data Raw image data from `fetch` or `cache` or somewhere else.
   */
  constructor(data: ArrayBuffer) {
    if (data instanceof ArrayBuffer) {
      this.data = data
      this._ref = constructImage(this.data)
      this.info = null
    } else {
      throw new Error("Data must be an ArrayBuffer")
    }
  }

  /**
   * Resize image to `width` x `height`. By default, the resized image is center
   * cropped to the exact size specified.
   * @param width Width in pixels of the resulting image.
   * Pass `undefined` or `null` to auto-scale the width to match the height.
   * @param height Height in pixels of the resulting image.
   * Pass `undefind` or `null` to auto-scale the height to match the width.
   * @param options Resize options
   * @returns {fly.Image}
   */
  resize(width?: number, height?: number, options?: Image.ResizeOptions) {
    this._imageOperation("resize", width, height, options)
    return this
  }

  /**
   * Overlay (composite) an image over the processed (resized, extracted etc.) image.
   *
   * The overlay image must be the same size or smaller than the processed image. If both top and left options are provided, they take precedence over gravity.
   *
   * If the overlay image contains an alpha channel then composition with premultiplication will occur.
   * @param overlay image to overlay
   * @param options control how the overlay is composited
   * @returns {fly.Image}
   */
  overlayWith(overlay: ArrayBuffer | Image, options?: Image.OverlayOptions) {
    let p: any = overlay
    if (p instanceof Image) {
      p = p._ref
    }
    this._imageOperation("overlayWith", p, options)
    return this
  }
  max() {
    this._imageOperation("max")
    return this
  }
  negate() {
    this._imageOperation("negate")
    return this
  }

  crop(...args: any[]) {
    this._imageOperation("crop", ...args)
    return this
  }

  embed(...args: any[]) {
    this._imageOperation("embed", ...args)
    return this
  }

  background(...args: any[]) {
    this._imageOperation("background", ...args)
    return this
  }

  withoutEnlargement(...args: any[]) {
    this._imageOperation("withoutEnlargement", ...args)
    return this
  }

  png(...args: any[]) {
    this._imageOperation("png", ...args)
    return this
  }

  webp(...args: any[]) {
    this._imageOperation("webp", ...args)
    return this
  }

  withMetadata(...args: any[]) {
    this._imageOperation("withMedata", ...args)
    return this
  }

  /**
   * Pads image by number of pixels. If image is 200px wide, `extend(20)` makes it 220px wide
   * @param extend If numeric, pads all sides of an image.
   *
   * Otherwise, pad each side by the specified amount.
   * @returns {fly.Image}
   */
  extend(extend: number | Image.ExtendOptions) {
    this._imageOperation("extend", extend)
    return this
  }

  metadata(): Image.Metadata {
    const m = imageMetadata(this._ref)
    this.info = m
    return m
  }

  /** @hidden */
  private _imageOperation(name: string, ...args: any[]) {
    if (!imageOperation) {
      throw new Error("Image operations not enabled")
    }
    return imageOperation(this._ref, name, ...args)
  }

  async toBuffer(): Promise<Image.OperationResult> {
    if (!imageToBuffer) {
      throw new Error("Image operations not enabled")
    }
    const result = await imageToBuffer(this._ref)
    return result
  }

  async toImage(): Promise<Image> {
    if (!imageToBuffer) {
      throw new Error("Image operations not enabled")
    }
    const result = await imageToBuffer(this._ref)
    const i = new Image(result.data)
    i.info = result.info
    return i
  }

  async toResponse(res:any = { headers: { "Content-Type": "image/jpg" }}): Promise<any> {
    const result = await imageToBuffer(this._ref)
    const i = await new Image(result.data)
    i.info = result.info
    return new Response(i.data, res)
  }

  static async imageFromPath(path:string) {
    const resp = await fetch(path)
    return new Image(await resp.arrayBuffer())
  }
}

export namespace Image {

  export interface Metadata {
    /** Number of pixels wide */
    width?: number;
    /** Number of pixels high */
    height?: number;
    /** Name of colour space interpretation e.g. srgb, rgb, cmyk, lab, b-w ... */
    space?: string;
    /** Number of bands e.g. 3 for sRGB, 4 for CMYK */
    channels?: number;
    /** Number of pixels per inch (DPI), if present */
    density?: number;
    /** Boolean indicating the presence of an embedded ICC profile */
    hasProfile?: boolean;
    /** Boolean indicating the presence of an alpha transparency channel */
    hasAlpha?: boolean;
    /** Number value of the EXIF Orientation header, if present */
    orientation?: number;

    format?: string;
  }
  export interface OperationResult {
    info: Image.Metadata
    data: ArrayBuffer
  }

  export interface ResizeOptions {
    /**
     * the kernel to use for image reduction.
     *  (optional, default `'lanczos3'`)
     */
    kernel?: kernel,
    /**
     * take greater advantage of the JPEG
     * and WebP shrink-on-load feature, which can lead to a slight moiré pattern on
     * some images. (optional, default `true`)
     */
    fastShrinkOnLoad?: boolean
  }

  export interface OverlayOptions {
    /**  gravity at which to place the overlay. (optional, default `center`) */
    gravity?: gravity,
    top?: number,
    left?: number,
    tile?: Boolean,
    cutout?: Boolean,
    density?: number
  }

  export interface ExtendOptions {
    top?: number,
    left?: number,
    bottom?: number,
    right?: number
  }
}

/** @hidden */
interface OperationFunction {
  (image: Image): Promise<Image.OperationResult>
}
/** @hidden */
interface MetadataFunction {
  (image: Image): Promise<Image.Metadata>
}
/**
 * @hidden
 */
let constructImage: (data: ArrayBuffer, options?: any) => any
/**
 * @hidden
 */
let imageOperation: (ref: any, name: string, ...args: any[]) => any
/** @hidden */
let imageToBuffer: (ref: any) => Promise<Image.OperationResult>
/** @hidden */
let imageMetadata: (ref: any) => Image.Metadata

/** @hidden */
export default function initImage(ivm: any, dispatcher: any) {
  constructImage = function (data: ArrayBuffer, options?: any) {
    return dispatcher.dispatchSync("fly.Image()", transferInto(ivm, data))
  }
  imageOperation = function (ref: any, name: string, ...args: any[]) {
    for (let i = 0; i < args.length; i++) {
      const a = args[i]
      if (a instanceof ArrayBuffer) {
        args[i] = transferInto(ivm, a)
      } else if (typeof a === "object" && !(a instanceof ivm.Reference)) {
        args[i] = new ivm.ExternalCopy(a).copyInto({ release: true })
      }
    }
    const result = dispatcher.dispatchSync("fly.Image.operation", ref, name, ...args)
    if (result != ref) {
      //console.error("Image ref mismatch:", name, ref.typeof, result.typeof)
      //throw new Error(["image operation failed, result not expected:", ref.typeof, result.typeof].join(" "))
    }
    return result
  }
  imageToBuffer = async function (ref: any) {
    return new Promise<Image.OperationResult>((resolve, reject) => {
      dispatcher.dispatch("fly.Image.toBuffer",
        ref,
        new ivm.Reference((err: string, data: ArrayBuffer, info: any) => {
          if (err) {
            reject(err)
            return
          }
          resolve({ data: data, info: info })
        })
      )
    })
  }
  imageMetadata = function imageMetadata(ref): Image.Metadata {
    return dispatcher.dispatchSync("fly.Image.metadata", ref)
  }
  return Image
}

export namespace Image {
  export enum gravity {
    center = 0,
    centre = 0,
    north = 1,
    east = 2,
    south = 3,
    west = 4,
    northeast = 5,
    southeast = 6,
    southwest = 7,
    northwest = 8
  };

  export enum strategy {
    entropy = 16,
    attention = 17
  }

  export enum kernel {
    nearest = 'nearest',
    cubic = 'cubic',
    lanczos2 = 'lanczos2',
    lanczos3 = 'lanczos3'
  }
}
