/** @module fly
 * @private
 */
import { parse as queryParse } from 'querystring'

/** @hidden */
interface ReadableStreamController {
  enqueue(chunk: string | ArrayBuffer): void
  close(): void
}
/** @hidden */
declare var ReadableStream: {
  prototype: ReadableStream;
  new(source: any | undefined): ReadableStream;
};

/** @hidden */
export type BodySource = Blob | BufferSource |
  FormData | URLSearchParams |
  ReadableStream | String

/** @hidden */
export default class BodyMixin implements Body {
  private readonly bodySource: BodySource
  private stream: ReadableStream | null

  constructor(obj: BodySource) {
    validateBodyType(this, obj)
    this.bodySource = obj
    this.stream = null
  }

  get body(): ReadableStream | null {
    if (this.stream) {
      return this.stream
    }
    if (this.bodySource instanceof ReadableStream) {
      this.stream = this.bodySource
    }
    if (typeof this.bodySource === "string") {
      this.stream = new ReadableStream({
        start(controller: ReadableStreamController) {
          controller.enqueue(this.bodySource)
          controller.close()
        }
      })
    }
    return this.stream
  }

  get bodyUsed(): boolean {
    if (this.body && this.body.locked) {
      return true
    }
    return false
  }

  async blob(): Promise<Blob> {
    return new Blob([await this.arrayBuffer()])
  }

  async formData(): Promise<FormData> {
    if (this.bodySource instanceof FormData) {
      return this.bodySource
    }

    const raw = await this.text()
    const query = queryParse(raw)
    const formdata = new FormData()
    for (let key in query) {
      if (Array.isArray(query[key])) {
        for (let val of query[key]) {
          formdata.append(key, val)
        }
      } else {
        formdata.append(key, String(query[key]))
      }
    }
    return formdata
  }

  async text(): Promise<string> {
    if (typeof this.bodySource === "string") {
      return this.bodySource
    }

    const arr = await this.arrayBuffer()
    return new TextDecoder('utf-8').decode(arr)
  }

  async json(): Promise<any> {
    const raw = await this.text()
    return JSON.parse(raw)
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.bodySource instanceof Int8Array ||
      this.bodySource instanceof Int16Array ||
      this.bodySource instanceof Int32Array ||
      this.bodySource instanceof Uint8Array ||
      this.bodySource instanceof Uint16Array ||
      this.bodySource instanceof Uint32Array ||
      this.bodySource instanceof Uint8ClampedArray ||
      this.bodySource instanceof Float32Array ||
      this.bodySource instanceof Float64Array
    ) {
      return <ArrayBuffer>this.bodySource.buffer
    } else if (this.bodySource instanceof ArrayBuffer) {
      return this.bodySource
    } else if (typeof this.bodySource === 'string') {
      const enc = new TextEncoder()
      return <ArrayBuffer>enc.encode(this.bodySource).buffer
    } else if (this.bodySource instanceof ReadableStream) {
      return bufferFromStream(this.bodySource.getReader())
    } else if (this.bodySource instanceof FormData) {
      const enc = new TextEncoder()
      return <ArrayBuffer>enc.encode(this.bodySource.toString()).buffer
    } else if (!this.bodySource) {
      return new ArrayBuffer(0)
    }
    throw new Error(`Body type not yet implemented: ${this.bodySource.constructor.name}`)
  }
}

/** @hidden */
function validateBodyType(owner: any, bodySource: any) {
  if (bodySource instanceof Int8Array ||
    bodySource instanceof Int16Array ||
    bodySource instanceof Int32Array ||
    bodySource instanceof Uint8Array ||
    bodySource instanceof Uint16Array ||
    bodySource instanceof Uint32Array ||
    bodySource instanceof Uint8ClampedArray ||
    bodySource instanceof Float32Array ||
    bodySource instanceof Float64Array
  ) {
    return true
  } else if (bodySource instanceof ArrayBuffer) {
    return true
  } else if (typeof bodySource === 'string') {
    return true
  } else if (bodySource instanceof ReadableStream) {
    return true
  } else if (bodySource instanceof FormData) {
    return true
  } else if (!bodySource) {
    return true // null body is fine
  }
  throw new Error(`Bad ${owner.constructor.name} body type: ${bodySource.constructor.name}`)
}

function bufferFromStream(stream: ReadableStreamReader): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    let parts: Array<Uint8Array> = [];
    let encoder = new TextEncoder();
    // recurse
    (function pump() {
      stream.read()
        .then(({ done, value }) => {
          if (done) {
            return resolve(concatenate(...parts))
          }

          if (typeof value === "string") {
            parts.push(encoder.encode(value))
          } else if (value instanceof ArrayBuffer) {
            parts.push(new Uint8Array(value))
          } else if (!value) {
            // noop for undefined
          } else {
            console.log("unhandled type on stream read:", value)
            reject("unhandled type on stream read")
          }

          return pump();
        })
        .catch((err) => {
          reject(err)
        });
    })()
  })
}

/** @hidden */
function concatenate(...arrays: Uint8Array[]): ArrayBuffer {
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
  return <ArrayBuffer>result.buffer;
}
