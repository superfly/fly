import { ivm } from './'
import { Context } from './context'
import { v8Env } from './v8env'
import { Trace } from './trace'

import { createContext } from './context'

import { App } from './app'
import log from './log';

import * as winston from 'winston'
import { LocalFileStore } from './local_file_store';
import { Bridge } from './bridge/bridge';

export interface DefaultContextStoreOptions {
  inspect?: boolean
}

export class DefaultContextStore {
  isolate?: ivm.Isolate
  options: DefaultContextStoreOptions
  inFlight: Context[]

  constructor(opts: DefaultContextStoreOptions = {}) {
    this.options = opts
    this.inFlight = []
    v8Env.on('snapshot', this.resetIsolate.bind(this))
  }

  async getContext(app: App, bridge: Bridge, trace?: Trace): Promise<Context> {
    const t = trace || Trace.start("acquireContext")
    let t2 = t.start("getIsolate")
    const iso = await this.getIsolate()
    t2.end()

    if (!iso)
      throw new Error("no isolate, something is very wrong")

    try {
      t2 = t.start("createContext")
      const ctx = await createContext(iso, bridge, { inspector: !!this.options.inspect })
      this.inFlight.push(ctx)
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
      this.resetIsolate()
      throw err
    }
  }

  drain() {
    return Promise.all(
      this.inFlight.map((ctx, i) =>
        ctx.finalize().then(() => this.inFlight.splice(i, 1))
      )
    )
  }

  putContext(ctx: Context) {
    const i = this.inFlight.indexOf(ctx)
    ctx.finalize().then(() => {
      ctx.release()
      log.info(`Heap is: ${ctx.iso.getHeapStatisticsSync().used_heap_size / (1024 * 1024)} MB`)
      if (i >= 0)
        this.inFlight.splice(i, 1)
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