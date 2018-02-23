import './proxy_stream'
import './fetch'
import './heap'
import './formdata'
import './logger'
import './fly/cache'
import { ivm } from '../'

import { catalog, BridgeFunction } from './'
import { Config, Context } from '../';

const errNoSuchBridgeFn = new Error("Attempted to call a unregistered bridge function.")

interface IterableIterator<T> extends Iterator<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

export class Bridge {
  functions: Map<string, BridgeFunction>

  constructor() {
    this.functions = new Map<string, BridgeFunction>(Array.from(catalog.entries(), ([n, fn]) =>
      <[string, BridgeFunction]>[n, fn]
    ))
  }

  dispatch(ctx: Context, config: Config, name: string, ...args: any[]) {
    const fn = this.functions.get(name)
    if (!fn)
      throw errNoSuchBridgeFn
    fn(ctx, config, ...args)
  }

  set(name: string, fn: BridgeFunction) {
    this.functions.set(name, fn)
  }

}