import { CacheNotifierAdapter, CacheOperation, ReceiveHandler, CacheNotifyMessage } from "./cache_notifier";
import { RedisClient } from "redis";
import { RedisConnectionOptions, initRedisClient } from "./redis_adapter";
import { promisify } from "util";
import log from "./log";

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
    console.log("notifier writer:", opts.writer)
    if (!opts.writer) {
      console.log("Using reader / writer")
      opts.writer = opts.reader
    }
    this.subscriber = initRedisClient(opts.reader)
    this.reader = initRedisClient(opts.reader)
    this.writer = initRedisClient(opts.writer)
  }

  send(msg: CacheNotifyMessage) {
    return new Promise<boolean>((resolve, reject) => {
      log.debug("sending redis cache notification:", msg.ts, msg.value, (<any>this.writer).address)
      this.writer.zadd(notifierKey, msg.ts, JSON.stringify(msg), (err, _) => {
        if (err) {
          return reject(err)
        }
        this.writer.zremrangebyscore(notifierKey, 0, Date.now() - 600) // only keep 10 min
        resolve(true)
      })
    })
  }
  async start(handler: ReceiveHandler) {
    this._handler = handler

    const configAsync = promisify(this.subscriber.config).bind(this.subscriber);
    const zrangebyscore = promisify(this.reader.zrangebyscore).bind(this.reader);

    let [, conf] = await configAsync("get", "notify-keyspace-events")
    if (!conf.includes("E") || !conf.includes('z') || !conf.includes('A')) {
      conf = conf + "KEz"
      log.info("Enabling zset notifications in redis:", conf)
      await configAsync("set", "notify-keyspace-events", conf)
    }
    this._lastEventTime = Date.now()
    const dbIndex = parseInt((<any>this.subscriber).selected_db || 0)
    log.info("Subscribing to Redis Cache notifications:", (<any>this.subscriber).address)
    this.subscriber.subscribe(`__keyspace@${dbIndex}__:notifier:cache`)
    this.subscriber.on('message', async (channel, message) => {
      log.debug("redis cache notification:", channel, message)

      if (message === "zadd") {
        const start = this._lastEventTime
        this._lastEventTime = Date.now()
        const changes = await zrangebyscore(notifierKey, start, '+inf')
        log.debug("redis cache notification changes:", start, changes.length)
        for (const raw of changes) {
          try {
            const msg = JSON.parse(raw)
            if (this._handler && isNotifierMessage(msg)) {
              this._handler(msg)
            } else {
              log.error("error handling notification:", !!this._handler, isNotifierMessage(msg), msg)
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