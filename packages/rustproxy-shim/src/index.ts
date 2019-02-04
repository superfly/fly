import * as bridge from "./bridge"
import * as domUtils from "./document"
import { MiddlewareChain } from "../../v8env/src/middleware"

if (window.libfly) {
  console.log("rustproxy detected, installing rustproxy-shim")

  Object.assign(window, {
    bridge,
    MiddlewareChain,
    ...domUtils,
    app: window.fly.app
  })
} else {
  console.log("nodeproxy detected, skip rustproxy-shim")
}
