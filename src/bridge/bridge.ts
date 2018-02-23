import './proxy_stream'
import './fetch'
import './heap'
import './formdata'
import './fly/cache'
import { ivm } from '../'

import { catalog, Context } from './'
import { Config } from '../config';

const errNoSuchBridgeFn = new Error("Attempted to call a unregistered bridge function.")

interface IterableIterator<T> extends Iterator<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

export class Bridge {
  functions: Map<string, Function>
  context: Context | null
  config: Config

  constructor(ctx: Context, config: Config) {
    this.context = ctx
    this.config = config
    this.functions = new Map<string, Function>(Array.from(catalog.entries(), ([n, fn]) =>
      <[string, Function]>[n, fn]
    ))
  }

  dispatch(name: string, ...args: any[]) {
    const fn = this.functions.get(name)
    if (!fn)
      throw errNoSuchBridgeFn
    fn(this.context, this.config, ...args)
  }

  dispose(){
    this.context = null
    delete this.context
  }
}