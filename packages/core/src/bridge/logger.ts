import { registerBridge } from "."
import { Bridge } from "./bridge"
import { Runtime } from "../runtime"

registerBridge("log", (rt: Runtime, bridge: Bridge, lvl: string, msg: string) => {
  rt.log(lvl, msg)
})
