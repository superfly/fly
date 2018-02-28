import { ivm } from './'
import { Context } from './context'
import { ContextStore } from './context_store'
import { v8Env } from './v8env'
import { Trace } from './trace'

import { createContext } from './context'

import { App } from './app'
import { Config } from './config';
import log from './log';

import * as winston from 'winston'

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

  async getContext(config: Config, app: App, trace?: Trace): Promise<Context> {
    const t = trace || Trace.start("acquireContext")
    let t2 = t.start("getIsolate")
    const iso = await this.getIsolate()
    t2.end()

    if (!iso)
      throw new Error("no isolate, something is very wrong")

    try {
      t2 = t.start("createContext")
      const ctx = await createContext(config, iso, { inspector: !!this.options.inspect })
      t2.end()

      ctx.set('app', app.forV8())

      // just reuse this logger.
      ctx.logger.add(winston.transports.Console, {
        timestamp: true
      })

      await ctx.runApp(app, t)

      return ctx
    } catch (err) {
      log.error("bombed somehow!", err, err.stack)
      throw err
    }
  }

  putContext(ctx: Context) {
    ctx.finalize().then(() => {
      ctx.release()
      log.info(`Heap is: ${ctx.iso.getHeapStatisticsSync().used_heap_size / (1024 * 1024)} MB`)
    })
  }

  async getIsolate() {
    if (this.isolate && !this.isolate.isDisposed)
      return this.isolate
    log.info("Getting a new isolate.")
    await v8Env.waitForReadiness()
    this.resetIsolate()
    return this.isolate
  }

  resetIsolate() {
    if (this.isolate)
      if (!this.isolate.isDisposed) {
        this.isolate.dispose()
      }
    this.isolate = new ivm.Isolate({
      snapshot: v8Env.snapshot,
      memoryLimit: 128,
      inspector: !!this.options.inspect
    })
  }
}