/**
 * Image manipulation APIs. Resize, convert, crop, etc. You can use this library to optimize images on-the-fly. Or, do clever things like adding watermarks.
 * 
 * Example:
 * ```javascript
 *   import { Image } from "@fly/image"
 *   const resp = await fetch(url)
 *   if (resp.status != 200) {
 *     throw new Error("Couldn't load image: " + url)
 *   }
 *   const body = await resp.arrayBuffer()
 * 
 *   return new Image(body)
 * ```
 * @module fly/image
 * @preferred
 */
/**
 * A class representing an Image. This uses operations from [Sharp](http://sharp.pixelplumbing.com/en/stable/) under the hood.
 */
export class Image {
  /** @hidden */
  data: ArrayBuffer | null
  /** @hidden */
  info: Image.Metadata | null

  /** @hidden */
  private _ref: any

  /**
   * Constructs a new Image from raw Buffer data
   * @param data Raw image data as a buffer, or options to create a new image
   */
  constructor(data: ArrayBuffer | Image.CreateOptions) {
    this.data = null
    this._ref = null
    if (data instanceof ArrayBuffer) {
      this.data = data
    }
    this._ref = constructImage(data)
    this.info = null
  }

  /**
   * Resize image to `width` x `height`. By default, the resized image is center 
   * cropped to the exact size specified. 
   * @param width Width in pixels of the resulting image.
   * Pass `undefined` or `null` to auto-scale the width to match the height.
   * @param height Height in pixels of the resulting image. 
   * Pass `undefind` or `null` to auto-scale the height to match the width.
   * @param options Resize options}
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
   */
  overlayWith(overlay: ArrayBuffer | Image, options?: Image.OverlayOptions) {
    let p: any = overlay
    if (p instanceof Image) {
      p = p._ref
    }
    this._imageOperation("overlayWith", p, options)
    return this
  }
  /**
   * Preserving aspect ratio, resize the image to be as large as possible
   * while ensuring its dimensions are less than or equal to the `width` and `height` specified.
   *
   * Both `width` and `height` must be provided via `resize` otherwise the behavior will default to `crop`.
   *
   * ```
   * const data = await new ImageinputBuffer)
   *   .resize(200, 200)
   *   .max()
   *   .toBuffer()
   * ```
   */
  max() {
    this._imageOperation("max")
    return this
  }

  /**
   * Produce the "negative" of the image.
   */
  negate() {
    this._imageOperation("negate")
    return this
  }

  /**
   * Crop the resized image to the exact size specified, the default behaviour.
   *
   * Possible attributes of the optional `sharp.gravity` are `north`, `northeast`, `east`, `southeast`, `south`,
   * `southwest`, `west`, `northwest`, `center` and `centre`.
   *
   * The experimental strategy-based approach resizes so one dimension is at its target length
   * then repeatedly ranks edge regions, discarding the edge with the lowest score based on the selected strategy.
   * - `entropy`: focus on the region with the highest [Shannon entropy](https://en.wikipedia.org/wiki/Entropy_%28information_theory%29).
   * - `attention`: focus on the region with the highest luminance frequency, colour saturation and presence of skin tones.
   *
   * ```
   * const cropped = await new Image(input)
   *   .resize(200, 200)
   *   .crop(Image.strategy.entropy)
   *   .toBuffer()
   * ```
   */
  crop(crop?: Image.gravity | Image.strategy) {
    this._imageOperation("crop", crop)
    return this
  }
  /**
   * Preserving aspect ratio, resize the image to the maximum `width` or `height` specified
   * then embed on a background of the exact `width` and `height` specified.
   *
   * If the background contains an alpha value then WebP and PNG format output images will
   * contain an alpha channel, even when the input image does not.
   *
   * ```
   * const data = new Image(input)
   *   .resize(200, 300)
   *   .background({r: 0, g: 0, b: 0, alpha: 0})
   *   .embed()
   *   .toBuffer();
   * ```
   * @param gravity embed to an edge/corner, defaults to `center`.
   */
  embed(gravity?: Image.gravity) {
    this._imageOperation("embed", gravity)
    return this
  }
  /**
   * Set the background for the `embed`, `flatten` and `extend` operations.
   * The default background is `{r: 0, g: 0, b: 0, alpha: 1}`, black without transparency.
   *
   * Delegates to the _color_ module, which can throw an Error
   * but is liberal in what it accepts, clipping values to sensible min/max.
   * The alpha value is a float between `0` (transparent) and `1` (opaque).
   *
   * @param rgba - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
   */
  background(rgba: string | Image.Color) {
    this._imageOperation("background", rgba)
    return this
  }
  /**
   * Do not enlarge the output image if the input image width or height are already less than the required dimensions.
   * This is equivalent to GraphicsMagick's `>` geometry option: _"change the dimensions of the image only if its width
   * or height exceeds the geometry specification"_. Use with `max()` to preserve the image's aspect ratio
   * The default behaviour before function call is false, meaning the image will be enlarged.
   * @param flag Toggle option
   */
  withoutEnlargement(flag?: boolean) {
    this._imageOperation("withoutEnlargement", flag)
    return this
  }

  /**
   * Output image to JPEG
   * 
   * ```
   *  * // Convert any input to very high quality JPEG output
   * const data = await new Image(input)
   *   .jpeg({
   *     quality: 100,
   *     chromaSubsampling: '4:4:4'
   *   })
   *   .toBuffer();
   * ```
   * 
   * @param options JPEG output options
   */
  jpeg(options?: Image.JpegOptions) {
    this._imageOperation("jpeg", options)
    return this
  }
  /**
   * Use these PNG options for output image.
   *
   * PNG output is always full colour at 8 or 16 bits per pixel.
   * Indexed PNG input at 1, 2 or 4 bits per pixel is converted to 8 bits per pixel.
   *
   * ```
   * // Convert any input to PNG output
   * const data = await new Image(input)
   *   .png()
   *   .toBuffer();
   * ```
   * 
   * @param options Compression and encoding options
   */
  png(options?: Image.PngOptions) {
    this._imageOperation("png", options)
    return this
  }

  /**
   * Output to webp.
   *
   * ```
   * // Convert any input to lossless WebP output
   * const data = await new Image(input)
   *   .webp({ lossless: true })
   *   .toBuffer();
   * ```
   * @param options webp encoding options, quality, etc
   */
  webp(options?: Image.WebpOptions) {
    this._imageOperation("webp", options)
    return this
  }

  /**
   * Include all metadata (EXIF, XMP, IPTC) from the input image in the output image.
   * The default behaviour, when `withMetadata` is not used, is to strip all metadata
   * and convert to the device-independent sRGB colour space. This will also convert
   * to and add a web-friendly sRGB ICC profile.
   * @param options 
   *  `options.orientation:` value between 1 and 8, used to update the EXIF
   * `Orientation` tag.
   */
  withMetadata(options?: { orientation: number }) {
    this._imageOperation("withMedata", options)
    return this
  }

  /**
   *  Merge alpha transparency channel, if any, with `background`.
   * @param flatten Defaults to true
   */
  flatten(flatten: boolean) {
    this._imageOperation("flatten", flatten)
    return this
  }

  /**
   * Pads image by number of pixels. If image is 200px wide, `extend(20)` makes it 220px wide
   * @param extend If numeric, pads all sides of an image.
   * 
   * Otherwise, pad each side by the specified amount.
   */
  extend(extend: number | Image.ExtendOptions) {
    this._imageOperation("extend", extend)
    return this
  }

  /**
   * Get metadata from image
   */
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
}

export namespace Image {
  export interface Color {
    /** red channel, 0-255 */
    r: number,
    /** green channel, 0-255 */
    g: number,
    /** blue channel, 0-255 */
    b: number,
    /** alpha channel, 0.0-1.0 */
    alpha: number
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

  /**
   * WebP output options
   */
  export interface WebpOptions {
    /** quality, integer 1-100, defaults to 80 */
    quality?: number,
    /** quality of alpha layer, integer 0-100, default to 100 */
    alphaQuality?: number,
    /** use lossless compression mode */
    lossless?: boolean,
    /** use near_lossless compression mode */
    nearLossless?: boolean,
    /** force WebP output, otherwise attempt to use input format, defaults to true */
    force?: boolean
  }

  /**
   * JPEG output options
   */
  export interface JpegOptions {
    /** quality, integer 1-100, defaults to 80 */
    quality?: number,
    /** use progressive (interlace) scan (defaults to false) */
    progressive?: boolean,
    /** set to '4:4:4' to prevent chroma subsampling when quality <= 90 */
    chromaSubsampling?: boolean,
    /** force output to jpeg (default true) */
    force?: boolean
  }

  /**
   * PNG output options
   */
  export interface PngOptions {
    /** use progressive (interlace) scan (defaults to false) */
    progressive?: boolean,
    /** zlib compression level, 0-9 (default to 9) */
    compressionLevel?: number,
    /** use adaptive row filtering (defaults to false) */
    adaptiveFiltering?: boolean,
    /** force PNG output (defaults to true) */
    force?: boolean
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

  export interface CreateOptions {
    width: number,
    height: number,
    channels: number,
    background: Color | string
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

/** @hidden */
function constructImage(data: ArrayBuffer | Image.CreateOptions, options?: any) {
  const args: any[] = [undefined, undefined]
  if (data instanceof ArrayBuffer) {
    args[0] = data
  } else if (data instanceof Object) {
    args[1] = data
  }
  return bridge.dispatchSync("fly.Image()", ...args)
}
function imageOperation(ref: any, name: string, ...args: any[]) {
  const result = bridge.dispatchSync("fly.Image.operation", ref, name, ...args)
  if (result != ref) {
    //console.error("Image ref mismatch:", name, ref.typeof, result.typeof)
    //throw new Error(["image operation failed, result not expected:", ref.typeof, result.typeof].join(" "))
  }
  return result
}
async function imageToBuffer(ref: any) {
  return new Promise<Image.OperationResult>((resolve, reject) => {
    bridge.dispatch("fly.Image.toBuffer",
      ref,
      (err: string, data: ArrayBuffer, info: any) => {
        if (err) {
          reject(err)
          return
        }
        resolve({ data: data, info: info })
      }
    )
  })
}
function imageMetadata(ref: any): Image.Metadata {
  return bridge.dispatchSync("fly.Image.metadata", ref)
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