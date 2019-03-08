import { Runtime } from "../../runtime"
import { Bridge } from "../bridge"
import { ivm, IvmCallback } from "../../ivm"
import { URL } from "url"
import { makeResponse, FetchBody, getPathKey } from "./util"
import { streamManager } from "../../stream_manager"

export const protocol = "file:"

export function handleRequest(rt: Runtime, bridge: Bridge, url: URL, init: any, body: FetchBody, cb: IvmCallback) {
  if (!bridge.fileStore) {
    cb.applyIgnored(null, ["no file store configured, should not happen!"])
    return
  }

  if (init.method && init.method !== "GET") {
    cb.applyIgnored(null, [null, makeResponse(405, "Method Not Allowed", url)])
    return
  }

  const key = getPathKey(url)

  try {
    bridge.fileStore
      .createReadStream(rt, key)
      .then(stream => {
        const id = streamManager.add(rt, stream)
        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(makeResponse(200, "OK", url)).copyInto({ release: true }),
          id
        ])
      })
      .catch(err => {
        cb.applyIgnored(null, [
          null,
          new ivm.ExternalCopy(makeResponse(404, "Not Found", url)).copyInto({
            release: true
          }),
          ""
        ])
      })
  } catch (e) {
    // Might throw FileNotFound
    cb.applyIgnored(null, [
      null,
      new ivm.ExternalCopy(makeResponse(404, "Not Found", url)).copyInto({ release: true }),
      ""
    ])
  }
}
