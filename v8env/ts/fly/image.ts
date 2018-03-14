/**
 * The Fly image API.
 * @module fly
 */

/**
 * A class for modifying images. This uses operations from [Sharp](http://sharp.pixelplumbing.com/en/stable/) under the hood.
 * @module fly
 */
export class Image {
  /** @hidden */
  data: ArrayBuffer
  /** @hidden */
  operations: Image.Operation[]
  /** @hidden */
  info: Image.Metadata | null

  /**
   * Constructs a new Image from raw Buffer data
   * @param data Raw image data from `fetch` or `cache` or somewhere else.
   */
  constructor(data: ArrayBuffer) {
    if (!(data instanceof ArrayBuffer)) {
      throw new Error("Data must be an ArrayBuffer")
    }
    //console.log("data:", data.constructor)
    this.data = data
    this.operations = []
    this.info = null
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
    this.operations.push({ name: "resize", args: [width, height, options] })
    return this
  }

  crop(...args: any[]) {
    this.operations.push({ name: "crop", args: args })
    return this
  }

  embed(...args: any[]) {
    this.operations.push({ name: "embed", args: args })
    return this
  }

  background(...args: any[]) {
    this.operations.push({ name: "background", args: args })
    return this
  }

  withoutEnlargement(...args: any[]) {
    this.operations.push({ name: "withoutEnlargement", args: args })
    return this
  }

  png(...args: any[]) {
    this.operations.push({ name: "png", args: args })
    return this
  }

  webp(...args: any[]) {
    this.operations.push({ name: "webp", args: args })
    return this
  }

  withMetadata(...args: any[]) {
    this.operations.push({ name: "withMedata", args: args })
    return this
  }

  async metadata(): Promise<Image.Metadata> {
    return await imageMetadata(this)
  }

  async toBuffer(): Promise<Image.OperationResult> {
    if (!modifyImage) {
      throw new Error("Image operations not enabled")
    }
    const result = await modifyImage(this)
    return result
  }

  async toImage(): Promise<Image> {
    const result = await this.toBuffer()
    const i = new Image(result.data)
    i.info = result.info
    return i
  }
}

export namespace Image {
  /** @hidden */
  export interface Operation {
    name: string,
    args: any[]
  }

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
let modifyImage: OperationFunction
/**
 * @hidden
 */
let imageMetadata: MetadataFunction

/**
 * @hidden 
 */
export default function initImage(ivm: any, dispatcher: any) {
  modifyImage = async function modifyImage(image: Image): Promise<Image.OperationResult> {
    return new Promise<Image.OperationResult>((resolve, reject) => {
      dispatcher.dispatch("flyModifyImage",
        new ivm.ExternalCopy(image.data).copyInto({ release: true }),
        new ivm.ExternalCopy(image.operations).copyInto({ release: true }),
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
  imageMetadata = async function imageMetadata(image: Image): Promise<Image.Metadata> {
    return new Promise<Image.Metadata>((resolve, reject) => {
      dispatcher.dispatch("flyImageMetadata",
        new ivm.ExternalCopy(image.data).copyInto({ release: true }),
        new ivm.Reference((err: string, metadata: any) => {
          if (err) {
            reject(err)
            return
          }
          resolve(metadata)
        })
      )
    })
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