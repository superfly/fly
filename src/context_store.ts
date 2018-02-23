import { App } from './app'
import { Context } from './context'
import { Trace } from './trace'
import { Config } from './config'

export interface ContextStore {
  getContext(config: Config, app: App, trace?: Trace): Promise<Context>
  putContext(ctx: Context): void
}