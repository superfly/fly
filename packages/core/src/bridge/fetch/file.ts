import { Runtime } from "../../runtime"
import { Bridge } from "../bridge"
import { getPathKey } from "./util"
import { streamManager } from "../../stream_manager"
import { RequestInit, FetchBody, ResponseInit, URL } from "./types"

export const protocol = "file:"

export async function handleRequest(
  rt: Runtime,
  bridge: Bridge,
  url: URL,
  init: RequestInit,
  body: FetchBody
): Promise<ResponseInit> {
  if (!bridge.fileStore) {
    throw new Error("no file store configured")
  }

  if (init.method && init.method !== "GET") {
    return { status: 405 }
  }

  try {
    const key = getPathKey(url)

    const stream = await bridge.fileStore.createReadStream(rt, key)
    return { status: 200, body: streamManager.add(rt, stream) }
  } catch (e) {
    // Might throw FileNotFound
    return { status: 404 }
  }
}
