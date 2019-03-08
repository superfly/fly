import { Runtime } from "../../runtime"
import { Bridge } from "../bridge"
import { ivm, IvmCallback } from "../../ivm"
import { URL } from "url"
import { FetchBody, getPathKey, dispatchError, dispatchFetchResponse } from "./util"
import { streamManager } from "../../stream_manager"

export const protocol = "file:"

export function handleRequest(rt: Runtime, bridge: Bridge, url: URL, init: any, body: FetchBody, cb: IvmCallback) {
  if (!bridge.fileStore) {
    dispatchError(cb, "no file store configured")
    return
  }

  if (init.method && init.method !== "GET") {
    dispatchFetchResponse(cb, { status: 405, url })
    return
  }

  const key = getPathKey(url)

  try {
    bridge.fileStore
      .createReadStream(rt, key)
      .then(stream => {
        const id = streamManager.add(rt, stream)
        dispatchFetchResponse(cb, { status: 200, url: url.href, body: id })
      })
      .catch(err => {
        dispatchFetchResponse(cb, { status: 404, url })
      })
  } catch (e) {
    // Might throw FileNotFound
    dispatchFetchResponse(cb, { status: 404, url })
  }
}
