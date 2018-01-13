export interface CacheStore {
  get(key: string): Promise<Buffer>
  set(key: string, value: any, ttl?: number): Promise<boolean>
  expire(key: string, ttl: number): Promise<boolean>
  ttl(key: string): Promise<number>
}