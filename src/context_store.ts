import { App } from './app'
import { Context } from './context'

export interface ContextStore {
  getContext(app: App): Promise<Context>
  putContext(ctx: Context): void
}