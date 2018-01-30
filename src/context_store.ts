import { App } from './app'
import { Context } from './context'
import { Trace } from './trace'

export interface ContextStore {
  getContext(app: App, trace?: Trace): Promise<Context>
  putContext(ctx: Context): void
}