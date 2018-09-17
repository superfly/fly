import { registerBridge } from "./"
import { ivm } from "../"
import { Bridge } from "./bridge"
import { Runtime } from "../runtime"
import { streamManager } from "../stream_manager"

registerBridge(
  "streamSubscribe",
  (rt: Runtime, bridge: Bridge, id: string, cb: ivm.Reference<() => void>) => {
    streamManager.subscribe(rt, id, cb)
  }
)

registerBridge(
  "streamRead",
  (rt: Runtime, bridge: Bridge, id: string, cb: ivm.Reference<() => void>) => {
    streamManager.read(rt, id, cb)
  }
)
