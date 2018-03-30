import { CacheStore } from './cache_store'
import * as IORedis from 'ioredis'
const util = require("util")
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
    let buf = await this.redis.getBuffer(key)
    if (!buf)
      return null
    return buf
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    let args = []
    if (ttl && !isNaN(ttl))
      args.push('EX', ttl)
    if (typeof value === "string") {
      value = new util.TextEncoder().encode(value)
    }
    return (await this.redis.set(key, value, ...args)) === OK
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return (await this.redis.expire(key, ttl)) === 1
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key)
  }
}