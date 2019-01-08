import * as bridge from "./bridge"
import * as domUtils from "./document"

if (!(window as any)) {
  console.log("nodeproxy detected, skip rustproxy-shim")
} else {
  console.log("rustproxy detected, installing rustproxy-shim")

  Object.assign(window, {
    bridge,
    ...domUtils
  })
}
