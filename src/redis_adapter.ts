import { RedisClient, ClientOpts as RedisClientOpts } from "redis";

export type RedisConnectionOptions = RedisClientOpts | string

/**
 * Utility method for taking common redis configs and creating a RedisClient
 */
export function initRedisClient(opts: RedisConnectionOptions) {
  if (opts instanceof RedisClient) return opts
  if (typeof opts === "string") {
    opts = { url: opts }
  }
  return new RedisClient(opts)
}