import './fetch'
import './formdata'
import './cache'
import './fly/cache'

import { catalog, Context } from './'

const errNoSuchBridgeFn = new Error("Attempted to call a unregistered bridge function.")

interface IterableIterator<T> extends Iterator<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

export class Bridge {
  functions: Map<string, Function>

  constructor(ctx: Context) {
    this.functions = new Map<string, Function>(Array.from(Array.from(catalog.entries()).map(([n, fn]) => [n, fn(ctx)])))
  }

  dispatch(name: string, ...args: any[]) {
    const fn = this.functions.get(name)
    if (!fn)
      throw errNoSuchBridgeFn
    fn.apply(null, args)
  }
}