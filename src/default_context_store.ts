import { ivm } from './'
import { Context } from './context'
import { ContextStore } from './context_store'
import { v8Env } from './v8env'

import { createContext } from './context'

import { App } from './app'

export class DefaultContextStore implements ContextStore {
  isolate: ivm.Isolate

  constructor() {
    v8Env.on('snapshot', this.resetIsolate.bind(this))
  }

  async getContext(app: App) {
    const iso = await this.getIsolate()
    const ctx = await createContext(iso)
    const script = await iso.compileScript(app.code)
    await script.run(ctx.ctx)
    return ctx
  }

  putContext(ctx: Context) {
    // Nothing to do here.
  }

  async getIsolate() {
    if (this.isolate)
      return this.isolate
    await v8Env.waitForReadiness()
    this.resetIsolate()
    return this.isolate
  }

  async resetIsolate() {
    if (this.isolate)
      this.isolate.dispose()
    this.isolate = new ivm.Isolate({ snapshot: v8Env.snapshot, memoryLimit: 1024 })
  }
}