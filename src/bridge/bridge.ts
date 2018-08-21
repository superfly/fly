/**
 * @module fly
 */

/**
 * @private
 */

import './proxy_stream'
import './fetch'
import './heap'
import './logger'
import './fly/cache'
import './fly/image'
import './fly/data'
import './text-encoding'
import './crypto'
import './error'
import './timers'
import { CacheStore, FileStore } from '../'

import { catalog, BridgeFunction } from './'
import { Runtime } from '../runtime';
import { DataStore } from '../data_store';
import { defaultCacheStore } from '../cache_store';
import { defaultCacheNotifier, CacheNotifier } from '../cache_notifier';

const errNoSuchBridgeFn = "Attempted to call a unregistered bridge function."

/**
 * @private
 */
interface IterableIterator<T> extends Iterator<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

/**
 * @private
 */
export interface BridgeOptions {
  cacheStore?: CacheStore
  fileStore?: FileStore
  dataStore?: DataStore
  cacheNotifier?: CacheNotifier
}
/**
 * @private
 */
export class Bridge {
  cacheStore: CacheStore
  fileStore?: FileStore
  dataStore?: DataStore
  cacheNotifier?: CacheNotifier

  functions: Map<string, BridgeFunction>

  constructor(opts: BridgeOptions = {}) {
    this.cacheStore = opts.cacheStore || defaultCacheStore()
    this.cacheNotifier = opts.cacheNotifier || defaultCacheNotifier(this.cacheStore)
    this.fileStore = opts.fileStore
    this.dataStore = opts.dataStore
    this.functions = new Map<string, BridgeFunction>(
      Array.from(catalog.entries(), ([n, fn]) =>
        <[string, BridgeFunction]>[n, fn]
      )
    )
  }

  dispatch(rt: Runtime, name: string, ...args: any[]) {
    const fn = this.functions.get(name)
    if (!fn)
      throw new Error(errNoSuchBridgeFn + ` ${name}`)
    return fn(rt, this, ...args)
  }

  set(name: string, fn: BridgeFunction) {
    this.functions.set(name, fn)
  }

}