import { CacheStore, CacheSetOptions } from "./cache_store"

import { RedisClient } from "redis"
import { promisify } from "util"
import { RedisConnectionOptions, initRedisClient } from "./redis_adapter"

export class RedisCacheStore implements CacheStore {
  public redis: FlyRedis

  constructor(redis: RedisConnectionOptions | RedisClient) {
    if (typeof redis === "string") {
      redis = { url: redis, detect_buffers: true }
    }
    if (!(redis instanceof RedisClient)) {
      redis = initRedisClient(redis)
    }
    this.redis = new FlyRedis(redis)
  }

  public async get(ns: string, key: string): Promise<Buffer> {
    const ret = await this.redis.getBufferAsync(Buffer.from(keyFor(ns, key)))
    return ret
  }

  public async getMulti(ns: string, keys: string[]) {
    keys = keys.map(k => keyFor(ns, k))
    const bufs = await this.redis.getMultiBufferAsync(keys)
    return bufs.map((b: any) => (!b ? null : Buffer.from(b)))
  }

  public async set(ns: string, key: string, value: any, options?: CacheSetOptions | number): Promise<boolean> {
    const k = keyFor(ns, key)
    let ttl: number | undefined
    if (typeof options === "number") {
      ttl = options
    } else if (options) {
      ttl = options.ttl
    }
    const commands = new Array<any>()
    if (typeof options === "object" && options.onlyIfEmpty === true) {
      // can't pipeline set NX
      const p = ttl ? this.redis.setAsync(k, value, "EX", ttl, "NX") : this.redis.setAsync(k, value, "NX")
      const result = await p
      // this happens if the key already exists
      if (result !== "OK") {
        return false
      }

      // otherwise we carry on
    } else {
      if (ttl) {
        this.redis.setAsync(k, value, "EX", ttl, "NX")
        commands.push(this.redis.setAsync(k, value, "EX", ttl))
      } else {
        commands.push(this.redis.setAsync(k, value))
      }
    }
    if (typeof options === "object" && options && options.tags instanceof Array) {
      commands.push(this.redis.saddAsync(k + ":tags", options.tags))
      commands.push(this.setTags(ns, key, options.tags))
      if (ttl) {
        commands.push(this.redis.expireAsync(k + ":tags", ttl))
      }
    } else {
      commands.push(this.redis.delAsync(k + ":tags"))
    }
    const pipelineResult = await Promise.all(commands)
    return redisGroupOK(pipelineResult)
  }

  public async expire(ns: string, key: string, ttl: number): Promise<boolean> {
    const k = keyFor(ns, key)
    const cmds = await Promise.all([this.redis.expireAsync(k, ttl), this.redis.expireAsync(k + ":tags", ttl)])
    return redisGroupOK(cmds)
  }

  public async ttl(ns: string, key: string): Promise<number> {
    return this.redis.ttlAsync(keyFor(ns, key))
  }

  public async del(ns: string, key: string): Promise<boolean> {
    const k = keyFor(ns, key)
    const cmds = await Promise.all([this.redis.delAsync(k), this.redis.delAsync(k + ":tags")])
    return redisGroupOK(cmds)
  }
  public async setTags(ns: string, key: string, tags: string[]): Promise<boolean> {
    const k = keyFor(ns, key)
    const p = tags.map(t => this.redis.saddAsync(tagKeyFor(ns, t), k))
    const result = await Promise.all(p)
    return result.filter(r => !r).length > 0
  }

  public async purgeTag(ns: string, tags: string): Promise<string[]> {
    const s = tagKeyFor(ns, tags)
    const keysToDelete = new Array<string>()
    const keysToCheck = new Array<string>()
    const checks = new Array<Promise<boolean>>()
    for await (const k of setScanner(this.redis, s)) {
      keysToCheck.push(k)
      checks.push(this.redis.sismemberAsync(k + ":tags", tags))
    }

    const result = await Promise.all(checks)
    const deletes = new Array<Promise<boolean>>()
    for (let i = 0; i < result.length; i++) {
      const r = result[i]
      if (r) {
        keysToDelete.push(keysToCheck[i])
      }
    }

    if (keysToDelete.length > 0) {
      deletes.push(this.redis.delAsync(...keysToDelete))
    }
    deletes.push(this.redis.delAsync(s))

    await Promise.all(deletes)
    return keysToDelete.map(k => k.replace(/^cache:[^:]+:/, ""))
  }
}

function tagKeyFor(ns: string, tag: string) {
  return `tag:${ns}:${tag}`
}
function keyFor(ns: string, key: string) {
  return `cache:${ns}:${key}`
}

function redisGroupOK(result: any) {
  const errors = result.filter((r: any) => {
    if (r instanceof Buffer) {
      r = r.toString()
    }
    if (
      (typeof r === "string" && r !== "OK") ||
      (typeof r === "number" && r < 0) ||
      (typeof r === "boolean" && r === false)
    ) {
      return true
    }
  })
  return errors.length === 0
}

if (Symbol && !Symbol.asyncIterator) {
  ;(Symbol as any).asyncIterator = Symbol.for("Symbol.asyncIterator")
}
async function* setScanner(redis: FlyRedis, key: string) {
  let cursor = 0
  do {
    const result = await redis.sscanAsync(key, cursor)
    cursor = parseInt(result[0], 10)
    yield* result[1] as string[]
  } while (cursor > 0)
}

class FlyRedis {
  public getBufferAsync: (key: Buffer | string) => Promise<Buffer>
  public getMultiBufferAsync: (keys: string[]) => Promise<Buffer[]>
  public setAsync: (
    key: string,
    value: Buffer,
    mode?: number | string,
    duration?: number,
    exists?: string
  ) => Promise<"OK" | undefined>
  public expireAsync: (key: string, ttl: number) => Promise<boolean>
  public ttlAsync: (key: string) => Promise<number>
  public delAsync: (...keys: string[]) => Promise<boolean>
  public saddAsync: (key: string, values: string | string[]) => Promise<boolean>
  public sscanAsync: (key: string, cursor: number) => Promise<[string, string[]]>
  public smembersAsync: (key: string) => Promise<string[] | undefined>
  public sismemberAsync: (key: string, member: string) => Promise<boolean>
  public redis: RedisClient
  constructor(redis: RedisClient) {
    this.redis = redis

    const p = promisify
    this.getBufferAsync = p(redis.get).bind(redis) as any
    this.getMultiBufferAsync = p(redis.mget).bind(redis) as any
    this.setAsync = p(redis.set).bind(redis) as any
    this.expireAsync = p(redis.expire).bind(redis) as any
    this.ttlAsync = p(redis.ttl).bind(redis)
    this.delAsync = p(redis.del).bind(redis) as any
    this.saddAsync = p(redis.sadd).bind(redis) as any
    this.sismemberAsync = p(redis.sismember).bind(redis) as any
    this.smembersAsync = p(redis.smembers).bind(redis)
    this.sscanAsync = this.sscanShim.bind(this) as any
  }

  // fake sscan function for mock redis
  public async sscanShim(key: string, cursor: number, count?: number) {
    if (!count) {
      count = 10
    }
    const members = await this.smembersAsync(key)
    if (members && cursor < members.length) {
      let newCursor = cursor + count
      if (newCursor > members.length) {
        newCursor = 0
      }
      return [newCursor.toString(), members.slice(cursor, cursor + count)]
    } else {
      return ["0", new Array<string>()]
    }
  }
}
