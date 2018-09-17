import { ivm } from "."
import { App } from "./app"

export interface Runtime {
  isolate: ivm.Isolate
  context: ivm.Context
  app: App

  get(name: string): Promise<ivm.Reference<any>>
  getSync(name: string): ivm.Reference<any>
  set(name: string, value: any): Promise<boolean>
  setSync(name: string, value: any): boolean

  log(lvl: string, ...parts: any[]): void
  reportUsage(name: string, info: any): void
}
