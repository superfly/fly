import { CacheStore } from "./cache_store"
import { RedisCacheNotifier } from "./redis_cache_notifier"
import { hostname } from "os"
import log from "./log"

export enum CacheOperation {
  del = "del",
  purgeTag = "purgeTag"
}

export interface CacheNotifyMessage {
  type: CacheOperation
  ns: string
  value: string
  ts: number
}

export type ReceiveHandler = (msg: CacheNotifyMessage) => void
export interface CacheNotifierAdapter {
  send(op: CacheNotifyMessage): Promise<boolean>
  start(handler: ReceiveHandler): void
}

export class CacheNotifier {
  public pid: string
  constructor(public cacheStore: CacheStore, public adapter: CacheNotifierAdapter) {
    this.pid = `${hostname()}-${process.pid}`
    this.adapter.start(this.handle.bind(this))
  }

  public async send(type: CacheOperation, ns: string, value: string) {
    log.debug("cache notifier sending:", this.adapter.constructor.name, type, ns, value)
    return this.adapter.send({ type, value, ns: ns.toString(), ts: Date.now() })
  }

  public async handle({ type, ns, value, ts }: CacheNotifyMessage): Promise<boolean> {
    const lockKey = "lock:" + [type, value, ts].join(":")
    log.debug("cache notifier received msg:", type, ns, value, this.adapter.constructor.name)
    const hasLock = await this.cacheStore.set(ns, lockKey, this.pid, { ttl: 10, onlyIfEmpty: true })
    if (!hasLock) { return false }
    try {
      switch (type) {
        case CacheOperation.del: {
          return await this.cacheStore.del(ns, value)
        }
        case CacheOperation.purgeTag: {
          const res = await this.cacheStore.purgeTag(ns, value)
          return res.length > 0
        }
        default:
          throw new Error(`Unknown CacheNotifierOperation: ${type}`)
      }
    } finally {
      // clean up lock
      await this.cacheStore.del(ns, lockKey)
    }
  }
}

export function isCacheOperation(op: any): op is CacheOperation {
  if (typeof op !== "string") { return false }

  const v = Object.getOwnPropertyNames(CacheOperation)

  if (v.includes(op)) {
    return true
  }
  return false
}

export class LocalCacheNotifier implements CacheNotifierAdapter {
  private _handler: ReceiveHandler | undefined
  public async send(msg: CacheNotifyMessage) {
    // using setImmediate here to fake an async adapter
    return new Promise<boolean>(resolve => {
      setImmediate(() => {
        this._handler && this._handler(msg)
        resolve(true)
      })
    })
  }

  public start(handler: ReceiveHandler) {
    this._handler = handler
  }
  /*switch(type) {
      case CacheNotifierOperation.del:
    return await this.cacheStore.del(ns, key)
      case CacheNotifierOperation.purgeTags:
    return !!(await this.cacheStore.purgeTags(ns, key))
      default:
    throw new Error(`Unknown CacheNotifierOperation: ${type}`)
    }
  }*/
} // */e

export function defaultCacheNotifier(cacheStore: CacheStore) {
  let adapter: CacheNotifierAdapter = new LocalCacheNotifier()
  if (process.env.REDIS_CACHE_NOTIFIER_URL) {
    console.log("Using Redis Cache Notifier")
    adapter = new RedisCacheNotifier({
      reader: process.env.REDIS_CACHE_NOTIFIER_URL,
      writer: process.env.REDIS_CACHE_NOTIFIER_WRITER_URL
    })
  }
  return new CacheNotifier(cacheStore, adapter)
}
