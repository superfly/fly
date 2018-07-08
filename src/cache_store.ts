import { Runtime } from "./runtime";

export interface CacheStore {
  get(rt: Runtime, key: string): Promise<Buffer | null>
  set(rt: Runtime, key: string, value: any, ttl?: number): Promise<boolean>
  expire(rt: Runtime, key: string, ttl: number): Promise<boolean>
  ttl(rt: Runtime, key: string): Promise<number>
  rand?: number
}