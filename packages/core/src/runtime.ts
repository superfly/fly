import { ivm } from "."
import { App } from "./app"
import { ResultTypeAsync, Transferable } from "isolated-vm"

export interface Runtime {
  isolate: ivm.Isolate
  context: ivm.Context
  app: App

  get(name: string): ResultTypeAsync<any>
  getSync(name: string): Transferable
  set(name: string, value: any): Promise<boolean>
  setSync(name: string, value: any): boolean

  log(lvl: string, ...parts: any[]): void
  reportUsage(name: string, info: any): void
}
