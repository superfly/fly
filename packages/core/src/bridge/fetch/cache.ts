import { Bridge } from "../bridge"
import { Runtime } from "../../runtime"
import log from "../../log"
import { streamManager } from "../../stream_manager"
import { OutgoingHttpHeaders } from "http"
import { normalizeBody, getPathKey } from "./util"
import { URL, RequestInit, FetchBody, ResponseInit } from "./types"

export const scheme = "cache:"

export async function handleRequest(
  rt: Runtime,
  bridge: Bridge,
  url: URL,
  init: RequestInit,
  body: FetchBody
): Promise<ResponseInit> {
  if (!bridge.blobStore) {
    throw new Error("no blob store configured")
  }

  try {
    const ns = rt.app.id.toString()
    const key = getPathKey(url)

    if (!key || key === "/") {
      return { status: 422, body: `invalid key: '${key}'` }
    }

    if (init.method === "GET") {
      log.debug("[blobcache] GET", { key })

      const res = await bridge.blobStore.get(ns, key)
      return {
        status: 200,
        body: streamManager.add(rt, res.stream, { readTimeout: init.readTimeout }),
        headers: res.headers
      }
    } else if (init.method === "PUT" || init.method === "POST") {
      log.debug("[blobcache] SET", { key })

      if (body === null) {
        return { status: 422, body: "body is required" }
      }

      const bodyBuf = normalizeBody(rt, body)
      const headers = extractHeaders(init.headers || {})

      const ok = await bridge.blobStore.set(ns, key, bodyBuf, { headers })
      if (ok) {
        return { status: 200 }
      }
      return { status: 400 }
    } else if (init.method === "DELETE") {
      log.debug("[blobcache] DEL", { key })

      const ok = await bridge.blobStore.del(ns, key)
      return { status: 200 }
    }

    return { status: 405 }
  } catch (err) {
    console.warn("[blobcache] error", err)
    return { status: 404 }
  }
}

const ALLOWED_HEADERS = ["content-type", "content-length", "content-encoding"]

function extractHeaders(headers: OutgoingHttpHeaders) {
  const out: { [name: string]: string } = {}
  for (const header of ALLOWED_HEADERS) {
    const val = headers[header]
    if (val) {
      if (typeof val === "string") {
        out[header] = val
      } else if (Array.isArray(val)) {
        out[header] = val.join(", ")
      } else if (typeof val === "number") {
        out[header] = val.toString()
      }
    }
  }
  return out
}
