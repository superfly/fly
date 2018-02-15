import { ivm } from './'
import { Context } from './context'
import { ContextStore } from './context_store'
import { v8Env } from './v8env'
import { Trace } from './trace'

import { createContext } from './context'

import { App } from './app'
import { Config } from './config';

export interface DefaultContextStoreOptions {
  inspect?: boolean
}

export class DefaultContextStore implements ContextStore {
  isolate?: ivm.Isolate
  options: DefaultContextStoreOptions

  constructor(opts: DefaultContextStoreOptions = {}) {
    this.options = opts
    v8Env.on('snapshot', this.resetIsolate.bind(this))
  }

  async getContext(config: Config, app: App, trace?: Trace) {
    const t = trace || Trace.start("acquireContext")
    let t2 = t.start("getIsolate")
    const iso = await this.getIsolate()
    t2.end()

    if (!iso)
      throw new Error("no isolate, something is very wrong")

    t2 = t.start("createContext")
    const ctx = await createContext(config, iso, { inspector: !!this.options.inspect })
    ctx.meta.set("iso", iso)
    t2.end()

    t2 = t.start("compile")
    const script = await iso.compileScript(app.source, { filename: `bundle-${app.sourceHash}.js` })
    t2.end()
    t2 = t.start("prerun")
    await script.run(ctx.ctx)
    t2.end()
    return ctx
  }

  putContext(ctx: Context) {
    // if (ctx.refCount > 0) {
    //   console.error("\x1b[31mContext was released but there are references:", ctx.refCount, "\x1b[0m")
    // }
    ctx.finalize().then(() => {
      ctx.release()
    })
    // this.resetIsolate()
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
      memoryLimit: 128,
      inspector: !!this.options.inspect
    })
  }
}