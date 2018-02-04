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
  currentSourceHash: string
  ctx: Context

  constructor(opts: DefaultContextStoreOptions = {}) {
    this.options = opts
    v8Env.on('snapshot', this.resetIsolate.bind(this))
  }

  async getContext(app: App, trace?: Trace) {
    const iso = await this.getIsolate()
    if (this.currentSourceHash && this.currentSourceHash === app.sourceHash) {
      if (this.ctx)
        return this.ctx
    } else if (this.currentSourceHash !== app.sourceHash) {
      if (this.ctx) {
        this.ctx.ctx.release()
        delete this.ctx
      }
    }
    this.ctx = await createContext(iso, { inspector: !!this.options.inspect })
    this.currentSourceHash = app.sourceHash
    const script = await iso.compileScript(app.source, { filename: 'bundle.js' })
    this.ctx.trace = trace
    const t = this.ctx.trace && this.ctx.trace.start("compile app")
    await script.run(this.ctx.ctx)
    t && t.end()
    return this.ctx
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
    if (this.ctx) {
      this.ctx.ctx.release()
      delete this.ctx
    }
    if (this.isolate)
      this.isolate.dispose()
    this.isolate = new ivm.Isolate({
      snapshot: v8Env.snapshot,
      memoryLimit: 1024,
      inspector: !!this.options.inspect
    })
  }
}