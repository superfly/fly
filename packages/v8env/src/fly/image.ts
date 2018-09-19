/**
 * 
 * @module image
 */

/**
 * @ignore
 */
declare var bridge: any

/**
 * Image manipulation APIs. Resize, convert, crop, etc. You can use this library to optimize images on-the-fly. Or, do clever things like adding watermarks.
```javascript
import { Image } from "@fly/image"
const resp = await fetch(url)
if (resp.status != 200) {
  throw new Error("Couldn't load image: " + url)
}
const body = await resp.arrayBuffer()

return new Image(body)
```
 */
export class Image {
  /** @ignore */
  public data: ArrayBuffer | null
  /** @ignore */
  public info: Metadata | null

  /** @ignore */
  private _ref: any

  /**
   * Constructs a new Image from raw Buffer data
   * @param data Raw image data as a buffer, or options to create a new image
   */
  constructor(data: ArrayBuffer | CreateOptions) {
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
   * @param options Resize options
   */
  public resize(width?: number, height?: number, options?: ResizeOptions) {
    this._imageOperation("resize", width, height, options)
    return this
  }

  /**
   * Scale image to `width` x `height`. This does not crop the image, it scales it to fit 
   * the specified width and height, and keeps the aspect ratio by default.
   * @param width Width in pixels of the resulting image.
   * Pass `undefined` or `null` to auto-scale the width to match the height.
   * @param height Height in pixels of the resulting image.
   * Pass `undefind` or `null` to auto-scale the height to match the width.
   * @param options Scale options
   */
  public scale(width?: number, height?: number, options?: ScaleOptions) {
    this._imageOperation('scale', width, height, options)
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
  public overlayWith(overlay: ArrayBuffer | Image, options?: OverlayOptions) {
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
   ```javascript
   const data = await new Image(inputBuffer)
     .resize(200, 200)
     .max()
     .toBuffer()
   ```
   */
  public max() {
    this._imageOperation("max")
    return this
  }

  /**
   * Produce the "negative" of the image.
   */
  public negate() {
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
   * ```javascript
   * const cropped = await new Image(input)
   *   .resize(200, 200)
   *   .crop(strategy.entropy)
   *   .toBuffer()
   * ```
   * @param crop the cropping strategy to use
   * @return the Image instance
   */
  public crop(crop?: gravity | strategy)
  /**
   * Crop to the specified width/height.
   * 
   * @param width width to crop to
   * @param height height to crop to, defaults to proportional height
   * @param crop the cropping strategy to use
   * @return the Image instance
   */
  public crop(width: number, height?: number, crop?: gravity | strategy)
  /** @ignore */
  public crop(widthOrCrop?: number | gravity | strategy, heightOrCrop?: number | gravity | strategy, crop?: gravity | strategy) {
    // crop can be an int so if we have one arg, assume it's crop
    if (widthOrCrop && !heightOrCrop && !crop) {
      crop = widthOrCrop
      widthOrCrop = undefined
    }
    const width = typeof widthOrCrop === "number" ? widthOrCrop : undefined
    const height = typeof heightOrCrop === "number" ? heightOrCrop : undefined
    if (!crop && !height && heightOrCrop) {
      crop = heightOrCrop
    }
    if (!crop && !width && widthOrCrop) {
      crop = widthOrCrop
    }
    this._imageOperation("crop", width, height, crop)
    return this
  }

  /**
   * Preserving aspect ratio, resize the image to the maximum `width` or `height` specified
   * then embed on a background of the exact `width` and `height` specified.
   *
   * If the background contains an alpha value then WebP and PNG format output images will
   * contain an alpha channel, even when the input image does not.
   *
   ```javascript
   const data = new Image(input)
     .resize(200, 300)
     .background({r: 0, g: 0, b: 0, alpha: 0})
     .embed()
     .toBuffer();
   ```
   * @param gravity embed to an edge/corner, defaults to `center`.
   */
  public embed(gravity?: gravity) {
    return this._imageOperation("embed", gravity)
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
  public background(rgba: string | Color) {
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
  public withoutEnlargement(flag?: boolean) {
    this._imageOperation("withoutEnlargement", flag)
    return this
  }

  /**
   * Output image to JPEG
   *
   ```javascript
   // Convert any input to very high quality JPEG output
   const data = await new Image(input)
     .jpeg({
       quality: 100,
       chromaSubsampling: '4:4:4'
     })
     .toBuffer();
   ```
   *
   * @param options JPEG output options
   */
  public jpeg(options?: JpegOptions) {
    this._imageOperation("jpeg", options)
    return this
  }
  /**
   * Use these PNG options for output image.
   *
   * PNG output is always full colour at 8 or 16 bits per pixel.
   * Indexed PNG input at 1, 2 or 4 bits per pixel is converted to 8 bits per pixel.
   *
   ``` javascript
   // Convert any input to PNG output
   const data = await new Image(input)
     .png()
     .toBuffer();
   ```
   *
   * @param options Compression and encoding options
   */
  public png(options?: PngOptions) {
    this._imageOperation("png", options)
    return this
  }

  /**
   * Output to webp.
   *
   ```
   // Convert any input to lossless WebP output
   const data = await new Image(input)
     .webp({ lossless: true })
     .toBuffer();
   ```
   * @param options webp encoding options, quality, etc
   */
  public webp(options?: WebpOptions) {
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
  public withMetadata(options?: { orientation: number }) {
    this._imageOperation("withMedata", options)
    return this
  }

  /**
   *  Merge alpha transparency channel, if any, with `background`.
   * @param flatten Defaults to true
   */
  public flatten(flatten: boolean) {
    this._imageOperation("flatten", flatten)
    return this
  }

  /**
   * Pads image by number of pixels. If image is 200px wide, `extend(20)` makes it 220px wide
   * @param extend If numeric, pads all sides of an image.
   *
   * Otherwise, pad each side by the specified amount.
   */
  public extend(extend: number | ExtendOptions) {
    this._imageOperation("extend", extend)
    return this
  }

  /**
   * Get metadata from image
   */
  public metadata(): Metadata {
    const m = imageMetadata(this._ref)
    this.info = m
    return m
  }

  /** @ignore */
  private _imageOperation(name: string, ...args: any[]) {
    if (!imageOperation) {
      throw new Error("Image operations not enabled")
    }
    const oldref = this._ref
    this._ref = imageOperation(this._ref, name, ...args)
    if (oldref && oldref != this._ref) {
      oldref.release()
    }
    return this
  }

  /**
   * Generate modified image.
   * 
   * @returns result with an `ArrayBuffer` and the new `Metadata` for the generated image.
   */
  public async toBuffer(): Promise<OperationResult> {
    if (!imageToBuffer) {
      throw new Error("Image operations not enabled")
    }
    const result = await imageToBuffer(this._ref)
    return result
  }

  /**
   * Generate modified image.
   * 
   * @returns a new `Image` instance with the generated image.
   */
  public async toImage(): Promise<Image> {
    if (!imageToBuffer) {
      throw new Error("Image operations not enabled")
    }
    const result = await imageToBuffer(this._ref)
    const i = new Image(result.data)
    i.info = result.info
    return i
  }

  /** these are for backwards compat with previous `Image` interface */
  /** @ignore */
  static get gravity() {
    return gravity
  }
  /** @ignore */
  static get strategy() {
    return strategy
  }
  /** @ignore */
  static get kernel() {
    return kernel
  }
  /** @ignore */
  static get fit() {
    return fit
  }


}

//export namespace Image {
export interface Color {
  /** red channel, 0-255 */
  r: number
  /** green channel, 0-255 */
  g: number
  /** blue channel, 0-255 */
  b: number
  /** alpha channel, 0.0-1.0 */
  alpha: number
}

export interface Metadata {
  /** Number of pixels wide */
  width?: number
  /** Number of pixels high */
  height?: number
  /** Name of colour space interpretation e.g. srgb, rgb, cmyk, lab, b-w ... */
  space?: string
  /** Number of bands e.g. 3 for sRGB, 4 for CMYK */
  channels?: number
  /** Number of pixels per inch (DPI), if present */
  density?: number
  /** Boolean indicating the presence of an embedded ICC profile */
  hasProfile?: boolean
  /** Boolean indicating the presence of an alpha transparency channel */
  hasAlpha?: boolean
  /** Number value of the EXIF Orientation header, if present */
  orientation?: number

  format?: string
}
export interface OperationResult {
  info: Metadata
  data: ArrayBuffer
}

/**
 * WebP output options
 */
export interface WebpOptions {
  /** quality, integer 1-100, defaults to 80 */
  quality?: number
  /** quality of alpha layer, integer 0-100, default to 100 */
  alphaQuality?: number
  /** use lossless compression mode */
  lossless?: boolean
  /** use near_lossless compression mode */
  nearLossless?: boolean
  /** force WebP output, otherwise attempt to use input format, defaults to true */
  force?: boolean
}

/**
 * JPEG output options
 */
export interface JpegOptions {
  /** quality, integer 1-100, defaults to 80 */
  quality?: number
  /** use progressive (interlace) scan (defaults to false) */
  progressive?: boolean
  /** set to '4:4:4' to prevent chroma subsampling when quality <= 90 */
  chromaSubsampling?: boolean
  /** force output to jpeg (default true) */
  force?: boolean
}

/**
 * PNG output options
 */
export interface PngOptions {
  /** use progressive (interlace) scan (defaults to false) */
  progressive?: boolean
  /** zlib compression level, 0-9 (default to 9) */
  compressionLevel?: number
  /** use adaptive row filtering (defaults to false) */
  adaptiveFiltering?: boolean
  /** force PNG output (defaults to true) */
  force?: boolean
}

/**
 * Options for resizing an image
 */
export interface ResizeOptions {
  /**
   * the kernel to use for image reduction.
   *  (optional, default `'lanczos3'`)
   */
  kernel?: kernel
  /**
   * take greater advantage of the JPEG
   * and WebP shrink-on-load feature, which can lead to a slight moiré pattern on
   * some images. (optional, default `true`)
   */
  fastShrinkOnLoad?: boolean,
}

/**
 * Options for scaling an image (see crop for cropping)
 */
export interface ScaleOptions extends ResizeOptions {
  /**
   * Stretch image if resize dimensions are larger than the source image.
   * 
   * Defaults to `true`
   */
  allowEnlargement?: boolean,

  /**
   * Resize to exactly the width and height specified, changing aspect ratio if necessary
   * 
   * Defaults to `false`
   */
  ignoreAspectRatio?: boolean

  /**
   * `fit` specifies how an image be scaled to fit the new dimensions
   * Defaults to `contain`.
   */
  fit?: fit
}

export interface OverlayOptions {
  /**  gravity at which to place the overlay. (optional, default `center`) */
  gravity?: gravity
  top?: number
  left?: number
  tile?: Boolean
  cutout?: Boolean
  density?: number
}

export interface ExtendOptions {
  top?: number
  left?: number
  bottom?: number
  right?: number
}

export interface CreateOptions {
  width: number
  height: number
  channels: number
  background: Color | string
}
//}

/** @ignore */
type OperationFunction = (image: Image) => Promise<OperationResult>
/** @ignore */
type MetadataFunction = (image: Image) => Promise<Metadata>

/** @ignore */
function constructImage(data: ArrayBuffer | CreateOptions, options?: any) {
  const args: any[] = [undefined, undefined]
  if (data instanceof ArrayBuffer) {
    args[0] = data
  } else if (data instanceof Object) {
    args[1] = data
  }
  return bridge.dispatchSync("fly.Image()", ...args)
}
function imageOperation(ref: any, name: string, ...args: any[]) {
  return bridge.dispatchSync("fly.Image.operation", ref, name, ...args)
}
async function imageToBuffer(ref: any) {
  return new Promise<OperationResult>((resolve, reject) => {
    bridge.dispatch("fly.Image.toBuffer", ref, (err: string, data: ArrayBuffer, info: any) => {
      if (err) {
        reject(err)
        return
      }
      resolve({ data, info })
    })
  })
}
function imageMetadata(ref: any): Metadata {
  return bridge.dispatchSync("fly.Metadata", ref)
}

//export namespace Image {
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
}

export enum strategy {
  entropy = 16,
  attention = 17
}

export enum kernel {
  nearest = "nearest",
  cubic = "cubic",
  lanczos2 = "lanczos2",
  lanczos3 = "lanczos3"
}

/**
 * Specifies how an image should fit into the provided `width` and `height`
 */
export enum fit {
  /**
   * Preserving aspect ratio, resize the image to be as small as possible while ensuring its 
   * dimensions are greater than or equal to the `width` and `height` specified.
   */
  cover = "cover",
  /**
   * Preserving aspect ratio, resize the image to be as large as possible while ensuring its 
   *  dimensions are less than or equal to the `width` and `height` specified.
   */
  contain = "contain",
  /**
   * Ignoring the aspect ratio of the input, stretch the image to the exact `width` and/or 
   * `height` provided.
   */
  fill = "fill"
}
//}
