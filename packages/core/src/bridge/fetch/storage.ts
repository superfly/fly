import { ivm, IvmCallback } from "../../ivm"
import { Bridge } from "../bridge"
import { Runtime } from "../../runtime"
import { UrlWithStringQuery } from "url"
import log from "../../log"
import { streamManager } from "../../stream_manager"
import { KeyNotFound } from "../../blob_store"

export function handleStorageRequest(
  rt: Runtime,
  bridge: Bridge,
  url: UrlWithStringQuery,
  init: any,
  body: ArrayBuffer | null | string,
  cb: IvmCallback
) {
  log.info("storage:", url)

  if (!bridge.blobStore) {
    cb.applyIgnored(null, ["no blob store configured!"])
    return
  }

  if (!url.pathname || url.pathname === "/") {
    cb.applyIgnored(null, [null, makeResponse(422, "Invalid key", url)])
    return
  }

  const key = url.pathname

  if (init.method === "GET") {
    bridge.blobStore
      .get(rt.app.id, key)
      .then(res => {
        const id = streamManager.add(rt, res.stream)
        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(makeResponse(200, "OK", url, res.headers)).copyInto({ release: true }),
          id
        ])
      })
      .catch(err => {
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
    if (body === null) {
      cb.applyIgnored(null, [null, makeResponse(422, "Body is required", url)])
      return
    }

    const bodyBuf = normalizeBody(body)

    bridge.blobStore
      .set(rt.app.id, key, bodyBuf)
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
    bridge.blobStore
      .del(rt.app.id, key)
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

function normalizeBody(body: string | ArrayBuffer | Buffer): Buffer {
  if (typeof body === "string") {
    return new Buffer(body)
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body)
  }

  return body
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
