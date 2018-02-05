import { ivm } from './'
import { Context } from './context'
import { ContextStore } from './context_store'
import { v8Env } from './v8env'
import { Trace } from './trace'

import { createContext } from './context'

import { App } from './app'

export interface DefaultContextStoreOptions {
  inspect?: boolean
}

export class DefaultContextStore implements ContextStore {
  isolate: ivm.Isolate
  options: DefaultContextStoreOptions

  constructor(opts: DefaultContextStoreOptions = {}) {
    this.options = opts
    v8Env.on('snapshot', this.resetIsolate.bind(this))
  }

  async getContext(app: App, trace?: Trace) {
    const iso = await this.getIsolate()
    const ctx = await createContext(iso, { inspector: !!this.options.inspect })
    const script = await iso.compileScript(app.source, { filename: 'bundle.js' })
    ctx.trace = trace
    const t = Trace.tryStart("compile", ctx.trace)
    await script.run(ctx.ctx)
    t.end()
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

  resetIsolate() {
    if (this.isolate)
      this.isolate.dispose()
    this.isolate = new ivm.Isolate({
      snapshot: v8Env.snapshot,
      memoryLimit: 1024,
      inspector: !!this.options.inspect
    })
  }
}