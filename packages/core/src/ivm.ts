import * as ivm from "isolated-vm"

export { ivm }

export type IvmCallback = ivm.Reference<() => void>
