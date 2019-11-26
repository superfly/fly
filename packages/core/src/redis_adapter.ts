import * as redis from "redis"

export type RedisConnectionOptions = redis.ClientOpts | string

/**
 * Utility method for taking common redis configs and creating a RedisClient
 */
export function initRedisClient(opts: RedisConnectionOptions) {
  if (opts instanceof redis.RedisClient) {
    return opts
  }
  if (typeof opts === "string") {
    opts = { url: opts }
  }
  opts = { ...opts, no_ready_check: true }
  const r = redis.createClient(opts)
  console.debug("Connected to redis:", (r as any).address)
  return r
}
