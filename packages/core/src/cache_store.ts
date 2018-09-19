import { Runtime } from "./runtime"
import { RedisCacheStore } from "./redis_cache_store"
import { MemoryCacheStore } from "./memory_cache_store"

export interface CacheSetOptions {
  ttl?: number
  tags?: string[]
  onlyIfEmpty?: boolean
}
export interface CacheStore {
  get(ns: string, key: string): Promise<Buffer | null>
  getMulti(ns: string, keys: string[]): Promise<Array<Buffer | null>>
  set(ns: string, key: string, value: any, options?: CacheSetOptions | number): Promise<boolean>
  del(ns: string, key: string): Promise<boolean>
  expire(ns: string, key: string, ttl: number): Promise<boolean>
  ttl(ns: string, key: string): Promise<number>
  setTags(ns: string, key: string, tags: string[]): Promise<boolean>
  purgeTag(ns: string, tag: string): Promise<string[]>
  rand?: number
}

let _defaultCacheStore: CacheStore | undefined
export function defaultCacheStore(): CacheStore {
  if (_defaultCacheStore) {
    return _defaultCacheStore
  }
  const url = process.env.REDIS_CACHE_URL
  if (url) {
    _defaultCacheStore = new RedisCacheStore(url)
  } else {
    _defaultCacheStore = new MemoryCacheStore()
  }
  return _defaultCacheStore
}
