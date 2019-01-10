import * as bridge from "./bridge"
import * as domUtils from "./document"

if (window.libfly) {
  console.log("rustproxy detected, installing rustproxy-shim")

  Object.assign(window, {
    bridge,
    ...domUtils,
    app: window.fly.app
  })
} else {
  console.log("nodeproxy detected, skip rustproxy-shim")
}
