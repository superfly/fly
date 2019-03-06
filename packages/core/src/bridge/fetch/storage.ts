import { ivm, IvmCallback } from "../../ivm"
import { Bridge } from "../bridge"
import { Runtime } from "../../runtime"
import { UrlWithStringQuery } from "url"
import log from "../../log"
import { streamManager } from "../../stream_manager"
import { KeyNotFound } from "../../blob_store"
import { Readable } from "stream"
import { bufferToStream } from "../../utils/buffer"
import { OutgoingHttpHeaders } from "http"

export const cacheScheme = "cache:"

export function handleCacheRequest(
  rt: Runtime,
  bridge: Bridge,
  url: UrlWithStringQuery,
  init: any,
  body: ArrayBuffer | null | string | number,
  cb: IvmCallback
) {
  if (!bridge.blobStore) {
    cb.applyIgnored(null, ["no blob store configured!"])
    return
  }

  const ns = rt.app.id.toString()
  const key = url.href!.substring(cacheScheme.length + 2)

  if (!key || key === "/") {
    cb.applyIgnored(null, [null, makeResponse(422, "Invalid key", url)])
    return
  }

  if (init.method === "GET") {
    log.debug("[blobcache] get", { key })

    bridge.blobStore
      .get(ns, key)
      .then(res => {
        const id = streamManager.add(rt, res.stream)
        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(makeResponse(200, "OK", url, res.headers)).copyInto({ release: true }),
          id
        ])
      })
      .catch(err => {
        log.error("blobstore adapter error", err)
        let res
        if (err instanceof KeyNotFound) {
          res = makeResponse(404, "Not Found", url)
        } else {
          res = makeResponse(500, `Service error: ${err}`, url)
        }

        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(res).copyInto({
            release: true
          }),
          ""
        ])
      })
  } else if (init.method === "PUT") {
    log.debug("[blobcache] put", { key })

    if (body === null) {
      cb.applyIgnored(null, [null, makeResponse(422, "Body is required", url)])
      return
    }

    const bodyBuf = normalizeBody(rt, body)

    const headers = extractHeaders(init.headers || {})

    bridge.blobStore
      .set(ns, key, bodyBuf, { headers })
      .then(() => {
        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(makeResponse(200, "OK", url)).copyInto({ release: true }),
          ""
        ])
      })
      .catch(err => {
        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(makeResponse(500, `Service error: ${err}`, url)).copyInto({
            release: true
          }),
          ""
        ])
      })
  } else if (init.method === "DELETE") {
    log.debug("[blobcache] delete", { key })

    bridge.blobStore
      .del(ns, key)
      .then(() => {
        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(makeResponse(200, "OK", url)).copyInto({ release: true }),
          ""
        ])
      })
      .catch(err => {
        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(makeResponse(500, `Service error: ${err}`, url)).copyInto({
            release: true
          }),
          ""
        ])
      })
  }

  return
}

function normalizeBody(rt: Runtime, body: string | number | ArrayBuffer | Buffer): Readable {
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

  throw new Error(`Unexpected body type: ${body}`)
}

// copied from ../fetch, consolidate that
function makeResponse(status: number, statusText: string, url: string | UrlWithStringQuery, headers?: any) {
  if (typeof url !== "string") {
    url = url.href!
  }

  return {
    status,
    statusText,
    ok: status >= 200 && status < 300,
    url,
    headers: headers || {}
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
