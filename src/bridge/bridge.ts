import './proxy_stream'
import './fetch'
import './heap'
import './logger'
import './fly/cache'
import './fly/image'
import './fly/font'
import './text-encoding'
import './crypto'
import './error'
import './timers'
import { ivm, CacheStore, FileStore } from '../'

import { catalog, BridgeFunction } from './'
import { Context } from '../';
import { MemoryCacheStore } from '../memory_cache_store';

const errNoSuchBridgeFn = "Attempted to call a unregistered bridge function."

interface IterableIterator<T> extends Iterator<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

export interface BridgeOptions {
  cacheStore?: CacheStore
  fileStore?: FileStore
}

export class Bridge {
  cacheStore: CacheStore
  fileStore?: FileStore
  functions: Map<string, BridgeFunction>

  constructor(opts: BridgeOptions = {}) {
    this.cacheStore = opts.cacheStore || new MemoryCacheStore()
    this.fileStore = opts.fileStore
    this.functions = new Map<string, BridgeFunction>(
      Array.from(catalog.entries(), ([n, fn]) =>
        <[string, BridgeFunction]>[n, fn]
      )
    )
  }

  dispatch(ctx: Context, name: string, ...args: any[]) {
    const fn = this.functions.get(name)
    if (!fn)
      throw new Error(errNoSuchBridgeFn + ` ${name}`)
    return fn(ctx, this, ...args)
  }

  set(name: string, fn: BridgeFunction) {
    this.functions.set(name, fn)
  }

}
