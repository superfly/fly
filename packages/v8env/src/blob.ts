/** 
 * @module fly
 * @private
 */

/** @hidden */
export type BlobPart = BufferSource | USVString | Blob

/** @hidden */
export default class Blob {
  readonly size: number;
  readonly type: string;

  protected bytes: Uint8Array;

  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
    if (!blobParts || blobParts.length === 0)
      this.bytes = new Uint8Array()
    else {
      let parts: Uint8Array[] = []
      let encoder = new TextEncoder();
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
            parts.push(new Uint8Array((<ArrayBufferView>part).buffer))
            break
          case Uint8Array:
            parts.push(<Uint8Array>part)
            break
          case ArrayBuffer:
            parts.push(new Uint8Array(<ArrayBuffer>part))
            break
          case String:
            parts.push(encoder.encode(<USVString>part))
            break
          case Blob:
            parts.push((<Blob>part).bytes)
            break
        }
      }
      if (parts.length === 1)
        this.bytes = parts[0]
      else
        this.bytes = concatenate(...parts)
    }

    if (options && options.type)
      this.type = options.type.toLowerCase()
    else
      this.type = ''

    this.size = this.bytes.byteLength
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    return new Blob([this.bytes.slice(start, end)], { type: contentType })
  }
}

/** @hidden */
function concatenate(...arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (let arr of arrays) {
    totalLength += arr.length;
  }
  let result = new Uint8Array(totalLength);
  let offset = 0;
  for (let arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}