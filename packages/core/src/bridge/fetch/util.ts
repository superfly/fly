import { URL } from "url"
import { Runtime } from "../../runtime"
import { Readable } from "stream"
import { bufferToStream } from "../../utils/buffer"
import { streamManager } from "../../stream_manager"
import { IvmCallback } from "core/src/ivm"
import { STATUS_CODES } from "http"
import { ivm } from "../../ivm"

export type FetchBody = string | number | ArrayBuffer | Buffer | null

export interface ResponseInit {
  url: string | URL
  status?: number
  statusText?: string
  headers?: Record<string, string>
  body?: number | string
}

export function normalizeBody(rt: Runtime, body: FetchBody): Readable {
  if (typeof body === "string") {
    return bufferToStream(new Buffer(body))
  }

  if (body instanceof ArrayBuffer) {
    return bufferToStream(Buffer.from(body))
  }

  if (Buffer.isBuffer(body)) {
    return bufferToStream(body)
  }

  if (typeof body === "number") {
    return streamManager.get(rt, body)
  }

  throw new Error(`Unexpected body type: ${typeof body}`)
}

/**
 * Get the full path for schemes that do not have a host, such as file:// and cache://
 */
export function getPathKey(url: URL): string {
  let key = url.host + url.pathname + url.search
  if (key.endsWith("?")) {
    key = key.substr(0, key.length - 1)
  }
  if (key.endsWith("/")) {
    key = key.substr(0, key.length - 1)
  }
  return key
}

export function dispatchError(cb: IvmCallback, err: string | Error) {
  cb.applyIgnored(null, [(err && err.toString()) || "unknown error"])
}

export function dispatchFetchResponse(cb: IvmCallback, response: ResponseInit) {
  const { body = "", ...init } = response

  if (!init.status) {
    init.status = 200
  }
  if (!init.statusText) {
    init.statusText = STATUS_CODES[init.status] || ""
  }
  if (init.url instanceof URL) {
    init.url = init.url.href
  }

  cb.applyIgnored(null, [null, new ivm.ExternalCopy(init).copyInto({ release: true }), body])
}
