import { URL } from "url"
import { Runtime } from "../../runtime"
import { Readable } from "stream"
import { bufferToStream } from "../../utils/buffer"
import { streamManager } from "../../stream_manager"

export type FetchBody = string | number | ArrayBuffer | Buffer | null

export interface FetchResponse {
  status: number
  statusText: string
  ok: boolean
  url: string
  headers: Record<string, string>
}

export function makeResponse(status: number, statusText: string, url: URL, headers?: any) {
  return {
    status,
    statusText,
    ok: status >= 200 && status < 300,
    url: url.href,
    headers: headers || {}
  }
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
