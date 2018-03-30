import { CacheStore } from './cache_store'
import * as IORedis from 'ioredis'

const Redis = require('ioredis-mock')
const OK = 'ok'

export class MemoryCacheStore implements CacheStore {
  redis: IORedis.Redis
  rand: number
  constructor(label?: string) {
    this.redis = new Redis()
    this.rand = Math.random()
  }

  async get(key: string): Promise<Buffer | null> {
    const buf = await this.redis.getBuffer(key)
    if (!buf)
      return null
    return Buffer.from(buf)
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    let args = []
    if (ttl && !isNaN(ttl))
      args.push('EX', ttl)
    return (await this.redis.set(key, value, ...args)) === OK
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return (await this.redis.expire(key, ttl)) === 1
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key)
  }
}