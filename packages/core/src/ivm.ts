import * as ivm from "isolated-vm"

export { ivm }

export type IvmCallback = ivm.Reference<() => void>

export function dispatchError(cb: IvmCallback, err: string | Error) {
  cb.applyIgnored(null, [(err && err.toString()) || "unknown error"])
}
