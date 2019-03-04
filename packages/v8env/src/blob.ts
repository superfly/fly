/**
 * @module fly
 * @private
 */

/** @hidden */
export type BlobPart = BufferSource | string | Blob

/** @hidden */
export default class Blob {
  public readonly size: number
  public readonly type: string

  protected bytes: Uint8Array

  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
    if (!blobParts || blobParts.length === 0) {
      this.bytes = new Uint8Array()
    } else {
      const parts: Uint8Array[] = []
      const encoder = new TextEncoder()
      for (const part of blobParts) {
        switch (part.constructor) {
          case Int8Array:
          case Uint8ClampedArray:
          case Int16Array:
          case Uint16Array:
          case Int32Array:
          case Uint32Array:
          case Float32Array:
          case Float64Array:
          case DataView:
            parts.push(new Uint8Array((part as ArrayBufferView).buffer))
            break
          case Uint8Array:
            parts.push(part as Uint8Array)
            break
          case ArrayBuffer:
            parts.push(new Uint8Array(part as ArrayBuffer))
            break
          case String:
            parts.push(encoder.encode(part as string))
            break
          case Blob:
            parts.push((part as Blob).bytes)
            break
        }
      }
      if (parts.length === 1) {
        this.bytes = parts[0]
      } else {
        this.bytes = concatenate(...parts)
      }
    }

    if (options && options.type) {
      this.type = options.type.toLowerCase()
    } else {
      this.type = ""
    }

    this.size = this.bytes.byteLength
  }

  public slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob([this.bytes.slice(start, end)], { type: contentType })
  }
}

/** @hidden */
function concatenate(...arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0
  for (const arr of arrays) {
    totalLength += arr.length
  }
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}
