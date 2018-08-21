import { CacheNotifierAdapter, CacheOperation, ReceiveHandler, CacheNotifyMessage } from "./cache_notifier";
import { RedisClient } from "redis";
import { RedisConnectionOptions, initRedisClient } from "./redis_adapter";
import { promisify } from "util";

export interface RedisCacheNotifierConfig {
  reader: RedisConnectionOptions,
  writer?: RedisConnectionOptions
}
const notifierKey = "notifier:cache"
export class RedisCacheNotifier implements CacheNotifierAdapter {
  subscriber: RedisClient
  reader: RedisClient
  writer: RedisClient
  private _handler: ReceiveHandler | undefined
  private _lastEventTime = Date.now() - 10000

  constructor(opts: RedisCacheNotifierConfig | RedisConnectionOptions) {
    if (!isRedisCacheNotifierConfig(opts)) {
      opts = { reader: opts }
    }
    if (!opts.writer) {
      opts.writer = opts.reader
    }
    this.subscriber = initRedisClient(opts.reader)
    this.reader = initRedisClient(opts.reader)
    this.writer = initRedisClient(opts.writer)
  }

  send(msg: CacheNotifyMessage) {
    return new Promise<boolean>((resolve, reject) => {
      this.writer.zadd(notifierKey, msg.ts, JSON.stringify(msg), (err, _) => {
        if (err) {
          return reject(err)
        }
        resolve(true)
      })
    })
  }
  async start(handler: ReceiveHandler) {
    this._handler = handler

    const configAsync = promisify(this.subscriber.config).bind(this.subscriber);
    const zrangebyscore = promisify(this.reader.zrangebyscore).bind(this.reader)

    let [, conf] = await configAsync("get", "notify-keyspace-events")
    if (!conf.includes("E") || !conf.includes('z')) {
      conf = conf + "KEz"
      console.log("Enabling zset notifications in redis:", conf)
      await configAsync("set", "notify-keyspace-events", conf)
    }
    this._lastEventTime = Date.now()
    const dbIndex = parseInt((<any>this.subscriber).selected_db || 0)
    this.subscriber.subscribe(`__keyspace@${dbIndex}__:notifier:cache`)
    this.subscriber.on('message', async (channel, message) => {
      const start = this._lastEventTime
      this._lastEventTime = Date.now()

      if (message === "zadd") {
        const changes = await zrangebyscore(notifierKey, start, '+inf')
        for (const raw of changes) {
          try {
            const msg = JSON.parse(raw)
            if (this._handler && isNotifierMessage(msg)) {
              this._handler(msg)
            }
          } catch (err) {
            console.error("Error handling cache notifier:", err)
          }
        }
      }
    })
  }
}

function isRedisCacheNotifierConfig(opts: any): opts is RedisCacheNotifierConfig {
  if (typeof opts === "object" && opts.reader) {
    return true
  }
  return false
}

function isNotifierMessage(msg: any): msg is CacheNotifyMessage {
  if (typeof msg.type === "string" &&
    typeof msg.ns === "string" &&
    typeof msg.value === "string" &&
    typeof msg.ts === "number") {
    return true
  }
  return false
}