import { Runtime } from "./runtime";
import { RedisCacheStore } from "./redis_cache_store";
import { MemoryCacheStore } from "./memory_cache_store";

export interface CacheSetOptions {
  ttl?: number,
  tags?: string[]
}
export interface CacheStore {
  get(rt: Runtime, key: string): Promise<Buffer | null>
  set(rt: Runtime, key: string, value: any, options?: CacheSetOptions | number): Promise<boolean>
  del(rt: Runtime, key: string): Promise<boolean>
  expire(rt: Runtime, key: string, ttl: number): Promise<boolean>
  ttl(rt: Runtime, key: string): Promise<number>,
  setTags(rt: Runtime, key: string, tags: string[]): Promise<boolean>,
  purgeTags(rt: Runtime, tags: string): Promise<string[]>
  rand?: number
}

let _defaultCacheStore: CacheStore | undefined
export function defaultCacheStore(): CacheStore {
  if (_defaultCacheStore) return _defaultCacheStore
  const url = process.env['REDIS_CACHE_URL']
  if (url) {
    _defaultCacheStore = new RedisCacheStore(url)
  } else {
    _defaultCacheStore = new MemoryCacheStore()
  }
  return _defaultCacheStore
}