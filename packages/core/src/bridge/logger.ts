import { registerBridge } from "."
import { Bridge } from "./bridge"
import { Runtime } from "../runtime"

registerBridge("log", function(rt: Runtime, bridge: Bridge, lvl: string, msg: string) {
  rt.log(lvl, msg)
})
