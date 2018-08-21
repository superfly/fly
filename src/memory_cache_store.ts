import { CacheStore, CacheSetOptions } from './cache_store'
import * as IORedis from 'ioredis'

const Redis = require('ioredis-mock')
const OK = 'OK'

export class MemoryCacheStore implements CacheStore {
  redis: IORedis.Redis
  rand: number
  constructor(label?: string) {
    this.redis = new Redis()
    this.rand = Math.random()
  }

  async get(ns: string, key: string): Promise<Buffer | null> {
    const buf = await this.redis.getBuffer(keyFor(ns, key))
    if (!buf)
      return null
    return Buffer.from(buf)
  }

  async set(ns: string, key: string, value: any, options?: CacheSetOptions | number): Promise<boolean> {
    const k = keyFor(ns, key)
    const pipeline = this.redis.pipeline()
    let ttl: number | undefined
    let mode: string | undefined
    if (typeof options === "number") {
      ttl = options
    } else if (options) {
      ttl = options.ttl
      mode = options.onlyIfEmpty && "NX" || undefined
    }

    if (mode) {
      const p = ttl ?
        this.redis.set(k, value, "EX", ttl, "NX") :
        this.redis.set(k, value, "NX")
      const result = await p
      // this happens if the key already exists
      if (result !== "OK") return false
    }
    if (ttl && !isNaN(ttl)) {
      pipeline.set(k, value, 'EX', ttl)
    } else {
      pipeline.set(k, value)
    }

    if (typeof options !== "number" && options && options.tags instanceof Array) {
      pipeline.sadd(k + ":tags", ...options.tags)
      this.setTags(ns, key, options.tags, pipeline)
      if (ttl) {
        pipeline.expire(k + ":tags", ttl)
      }
    } else {
      pipeline.del(k + ":tags")
    }
    const result = await pipeline.exec()
    return pipelineResultOK(result)
  }

  async del(ns: string, key: string): Promise<boolean> {
    key = keyFor(ns, key)
    await Promise.all([
      this.redis.del(key),
      this.redis.del(key + ":tags")
    ])
    return true
  }

  async expire(ns: string, key: string, ttl: number): Promise<boolean> {
    key = keyFor(ns, key)
    await Promise.all([
      this.redis.expire(key, ttl),
      this.redis.expire(key + ":tags", ttl)
    ])
    return true
  }

  async ttl(ns: string, key: string): Promise<number> {
    return this.redis.ttl(keyFor(ns, key))
  }

  async setTags(ns: string, key: string, tags: string[], pipeline?: IORedis.Pipeline): Promise<boolean> {
    const doSave = !pipeline
    if (!pipeline) {
      pipeline = this.redis.pipeline()
    }
    const k = keyFor(ns, key)
    for (let s of tags) {
      s = tagKeyFor(ns, s)
      pipeline.sadd(s, k)
    }
    if (doSave) {
      const result = await pipeline.exec()
      return pipelineResultOK(result)
    } else {
      return true
    }
  }

  async purgeTag(ns: string, tags: string): Promise<string[]> {
    const s = tagKeyFor(ns, tags)
    const checks = this.redis.pipeline()
    const keysToDelete = new Array<string>()
    const keysToCheck = []
    for await (const k of setScanner(this.redis, s)) {
      keysToCheck.push(k)
    }

    for (const k of keysToCheck) {
      checks.sismember(k + ":tags", tags)
    }
    const result = await checks.exec()
    const deletes = this.redis.pipeline()
    for (let i = 0; i < result.length; i++) {
      const r = result[i]
      if (r[1]) {
        keysToDelete.push(keysToCheck[i])
      }
    }

    deletes.del(...keysToDelete)
    deletes.del(s)

    const r = await deletes.exec()
    return keysToDelete.map((k) => k.replace(/^cache:[^:]+:/, ''))
  }
}

if (Symbol && !Symbol.asyncIterator)
  (<any>Symbol).asyncIterator = Symbol.for("Symbol.asyncIterator");
async function* setScanner(redis: IORedis.Redis, key: string) {
  let cursor = 0
  do {
    const result = await redis.sscan(key, cursor)
    cursor = result[0]
    yield* (<string[]>result[1])
  } while (cursor > 0)
}

function tagKeyFor(ns: string, tag: string) {
  return `tag:${ns}:${tag}`
}
function keyFor(ns: string, key: string) {
  return `cache:${ns}:${key}`
}

function pipelineResultOK(result: any) {
  const errors = result.filter((r: any) => {
    if (r[0]) {
      return true
    }
    if (r[1] !== 'OK' || (typeof r[1] === 'number' && r[1] < 0))
      return false
  })
  return errors.length === 0
}