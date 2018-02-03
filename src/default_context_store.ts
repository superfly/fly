import { ivm } from './'
import { Context } from './context'
import { ContextStore } from './context_store'
import { v8Env } from './v8env'
import { Trace } from './trace'

import { createContext } from './context'

import { App } from './app'

export class DefaultContextStore implements ContextStore {
  isolate: ivm.Isolate
  isoOptions: ivm.IsolateOptions
  ctxOptions: ivm.ContextOptions

  constructor(isoOptions: ivm.IsolateOptions = {}, ctxOptions: ivm.ContextOptions = {}) {
    this.isoOptions = isoOptions
    this.ctxOptions = ctxOptions
    v8Env.on('snapshot', this.resetIsolate.bind(this))
  }

  async getContext(app: App, trace?: Trace) {
    const iso = await this.getIsolate()
    const ctx = await createContext(iso, this.ctxOptions)
    const script = await iso.compileScript(app.source)
    ctx.trace = trace
    const t = ctx.trace && ctx.trace.start("compile app")
    await script.run(ctx.ctx)
    t && t.end()
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
    this.isolate = new ivm.Isolate(Object.assign({ snapshot: v8Env.snapshot, memoryLimit: 1024 }, this.isoOptions))
  }
}