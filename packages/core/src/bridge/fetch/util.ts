import { Runtime } from "../../runtime"
import { Readable } from "stream"
import { bufferToStream } from "../../utils/buffer"
import { streamManager } from "../../stream_manager"
import { FetchBody, URL } from "./types"

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
