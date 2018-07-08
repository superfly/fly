import { CacheStore } from './cache_store'
import * as IORedis from 'ioredis'
import { Runtime } from './runtime';

const Redis = require('ioredis-mock')
const OK = 'OK'

export class MemoryCacheStore implements CacheStore {
  redis: IORedis.Redis
  rand: number
  constructor(label?: string) {
    this.redis = new Redis()
    this.rand = Math.random()
  }

  async get(rt: Runtime, key: string): Promise<Buffer | null> {
    const buf = await this.redis.getBuffer(keyFor(rt, key))
    if (!buf)
      return null
    return Buffer.from(buf)
  }

  async set(rt: Runtime, key: string, value: any, ttl?: number): Promise<boolean> {
    let args = []
    if (ttl && !isNaN(ttl))
      args.push('EX', ttl)
    const result = await this.redis.set(keyFor(rt, key), value, ...args)
    return result === OK
  }

  async expire(rt: Runtime, key: string, ttl: number): Promise<boolean> {
    return (await this.redis.expire(keyFor(rt, key), ttl)) === 1
  }

  async ttl(rt: Runtime, key: string): Promise<number> {
    return this.redis.ttl(keyFor(rt, key))
  }
}

function keyFor(rt: Runtime, key: string) {
  return `cache:${rt.app.name}:${key}`
}