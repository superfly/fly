import { ivm, IvmCallback } from "../../ivm"
import { Bridge } from "../bridge"
import { Runtime } from "../../runtime"
import { URL } from "url"
import log from "../../log"
import { streamManager } from "../../stream_manager"
import { KeyNotFound, BlobStore } from "../../blob_store"
import { OutgoingHttpHeaders } from "http"
import { FetchBody, normalizeBody, getPathKey, dispatchError, dispatchFetchResponse } from "./util"

export const scheme = "cache:"

export function handleRequest(rt: Runtime, bridge: Bridge, url: URL, init: any, body: FetchBody, cb: IvmCallback) {
  if (!bridge.blobStore) {
    dispatchError(cb, "no blob store configured")
    return
  }

  const ns = rt.app.id.toString()
  const key = getPathKey(url)

  if (!key || key === "/") {
    dispatchFetchResponse(cb, { status: 422, url, body: `invalid key: '${key}'` })
    return
  }

  if (init.method === "GET") {
    log.debug("[blobcache] get", { key })

    bridge.blobStore
      .get(ns, key)
      .then(res => {
        dispatchFetchResponse(cb, {
          status: 200,
          url,
          body: streamManager.add(rt, res.stream, { readTimeout: init.readTimeout }),
          headers: res.headers
        })
      })
      .catch(err => {
        log.error("blobstore adapter error", err)
        if (err instanceof KeyNotFound) {
          dispatchFetchResponse(cb, { status: 404, url })
        } else {
          dispatchFetchResponse(cb, { status: 500, url, body: `Service error: ${err}` })
        }
      })
  } else if (init.method === "PUT") {
    log.debug("[blobcache] put", { key })

    if (body === null) {
      dispatchFetchResponse(cb, { status: 422, url, body: "body is required" })
      return
    }

    const bodyBuf = normalizeBody(rt, body)
    const headers = extractHeaders(init.headers || {})

    bridge.blobStore
      .set(ns, key, bodyBuf, { headers })
      .then(() => {
        dispatchFetchResponse(cb, { status: 200, url })
      })
      .catch(err => {
        dispatchFetchResponse(cb, { status: 500, url, body: `Service error: ${err}` })
      })
  } else if (init.method === "DELETE") {
    log.debug("[blobcache] delete", { key })

    bridge.blobStore
      .del(ns, key)
      .then(() => {
        dispatchFetchResponse(cb, { status: 200, url })
      })
      .catch(err => {
        dispatchFetchResponse(cb, { status: 500, url, body: `Service error: ${err}` })
      })
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
