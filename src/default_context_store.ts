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
  private mutex: Mutex

  constructor(opts: DefaultContextStoreOptions = {}) {
    this.options = opts
    this.mutex = new Mutex
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
      await this.mutex.lock()
      t2 = t.start("createContext")
      const ctx = await createContext(iso, bridge, { inspector: !!this.options.inspect })
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
    } finally {
      this.mutex.release()
    }
  }

  putContext(ctx: Context) {
    ctx.finalize().then(() => {
      log.debug("Context finalized.")
      ctx.release().then(() => {
        log.info(`Heap is: ${ctx.iso.getHeapStatisticsSync().used_heap_size / (1024 * 1024)} MB`)
      })
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

class Mutex {
  queue: Array<[Function, Function]>
  locked: boolean
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  lock() {
    return new Promise((resolve, reject) => {
      if (this.locked) {
        this.queue.push([resolve, reject]);
      } else {
        this.locked = true;
        resolve();
      }
    });
  }

  release() {
    if (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item)
        item[0]();
    } else {
      this.locked = false;
    }
  }
}