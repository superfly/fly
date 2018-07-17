import { Runtime } from "./runtime";

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