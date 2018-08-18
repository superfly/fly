import { CacheStore, CacheSetOptions } from './cache_store';

import { RedisClient } from 'redis';
import { Runtime } from "./runtime";
import { promisify } from 'util';

export class RedisCacheStore implements CacheStore {
  redis: FlyRedis

  constructor(redis: string | RedisClient) {
    if (typeof redis === "string") {
      redis = new RedisClient({ url: redis, detect_buffers: true })
    }
    this.redis = new FlyRedis(redis)
  }

  async get(rt: Runtime, key: string): Promise<Buffer> {
    const ret = await this.redis.getBufferAsync(Buffer.from(keyFor(rt, key)))
    return ret
  }

  async set(rt: Runtime, key: string, value: any, options?: CacheSetOptions | number): Promise<boolean> {
    const start = Date.now()
    const k = keyFor(rt, key)
    let ttl: number | undefined
    if (typeof options === "number") {
      ttl = options
    } else if (options) {
      ttl = options.ttl
    }
    const commands = new Array<any>()
    if (ttl) {
      commands.push(this.redis.setAsync(k, value, 'EX', ttl))
    } else {

      commands.push(this.redis.setAsync(k, value))
    }
    if (typeof options === "object" && options && options.tags instanceof Array) {
      commands.push(this.redis.saddAsync(k + ":tags", options.tags))
      commands.push(this.setTags(rt, key, options.tags))
      if (ttl) {
        commands.push(this.redis.expireAsync(k + ":tags", ttl))
      }
    } else {
      commands.push(this.redis.delAsync(k + ":tags"))
    }
    const result = await Promise.all(commands)
    return redisGroupOK(result)
  }

  async expire(rt: Runtime, key: string, ttl: number): Promise<boolean> {
    const k = keyFor(rt, key)
    const cmds = await Promise.all([
      this.redis.expireAsync(k, ttl),
      this.redis.expireAsync(k + ":tags", ttl)
    ])
    return redisGroupOK(cmds)
  }

  async ttl(rt: Runtime, key: string): Promise<number> {
    return this.redis.ttlAsync(keyFor(rt, key))
  }

  async del(rt: Runtime, key: string): Promise<boolean> {
    const k = keyFor(rt, key)
    const cmds = await Promise.all([
      this.redis.delAsync(k),
      this.redis.delAsync(k + ":tags")
    ])
    return redisGroupOK(cmds)
  }
  async setTags(rt: Runtime, key: string, tags: string[]): Promise<boolean> {
    const k = keyFor(rt, key)
    const p = tags.map((t) => this.redis.saddAsync(tagKeyFor(rt, t), k))
    const result = await Promise.all(p)
    return result.filter((r) => !r).length > 0
  }

  async purgeTags(rt: Runtime, tags: string): Promise<string[]> {
    const s = tagKeyFor(rt, tags)
    const keysToDelete = new Array<string>()
    const keysToCheck = new Array<string>()
    const checks = new Array<Promise<boolean>>()
    for await (const k of setScanner(this.redis, s)) {
      keysToCheck.push(k)
      checks.push(this.redis.sismemberAsync(k + ':tags', tags))
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

    const r = await Promise.all(deletes)
    return keysToDelete.map((k) => k.replace(/^cache:[^:]+:/, ''))
  }
}

function tagKeyFor(rt: Runtime, tag: string) {
  return `tag:${rt.app.name}:${tag}`
}
function keyFor(rt: Runtime, key: string) {
  return `cache:${rt.app.name}:${key}`
}

function redisGroupOK(result: any) {
  const errors = result.filter((r: any) => {
    if (r instanceof Buffer) {
      r = r.toString()
    }
    if (
      (typeof r === "string" && r !== 'OK') ||
      (typeof r === 'number' && r < 0) ||
      (typeof r === 'boolean' && r === false))
      return true
  })
  return errors.length === 0
}

if (Symbol && !Symbol.asyncIterator)
  (<any>Symbol).asyncIterator = Symbol.for("Symbol.asyncIterator");
async function* setScanner(redis: FlyRedis, key: string) {
  let cursor = 0
  do {
    const result = await redis.sscanAsync(key, cursor)
    cursor = parseInt(result[0])
    yield* (<string[]>result[1])
  } while (cursor > 0)
}

class FlyRedis {
  getBufferAsync: (key: Buffer | string) => Promise<Buffer>
  setAsync: (key: string, value: Buffer, mode?: number | string, duration?: number) => Promise<"OK" | undefined>
  expireAsync: (key: string, ttl: number) => Promise<boolean>
  ttlAsync: (key: string) => Promise<number>
  delAsync: (...keys: string[]) => Promise<boolean>
  saddAsync: (key: string, values: string | string[]) => Promise<boolean>
  sscanAsync: (key: string, cursor: number) => Promise<[string, string[]]>
  smembersAsync: (key: string) => Promise<string[] | undefined>
  sismemberAsync: (key: string, member: string) => Promise<boolean>
  redis: RedisClient
  constructor(redis: RedisClient) {
    this.redis = redis

    const p = promisify
    this.getBufferAsync = p(redis.get).bind(redis)
    this.setAsync = p(redis.set).bind(redis)
    this.expireAsync = p(redis.expire).bind(redis)
    this.ttlAsync = p(redis.ttl).bind(redis)
    this.delAsync = p(redis.del).bind(redis)
    this.saddAsync = p(redis.sadd).bind(redis)
    this.sismemberAsync = p(redis.sismember).bind(redis)
    this.smembersAsync = p(redis.smembers).bind(redis)
    this.sscanAsync = this.sscanShim.bind(this)
  }

  // fake sscan function for mock redis
  async sscanShim(key: string, cursor: number, count?: number) {
    if (!count) count = 10
    const members = await this.smembersAsync(key)
    console.log("got members:", members)
    if (members && cursor < members.length) {
      let newCursor = cursor + count
      if (newCursor > members.length) {
        newCursor = 0
      }
      return [newCursor.toString(), members.slice(cursor, cursor + count)]
    } else {
      return ['0', new Array<string>()]
    }
  }

}