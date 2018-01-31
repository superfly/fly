import { AppStore } from './app/store'
import { CacheStore } from './cache_store'
import { MemoryCacheStore } from './caches/memory'
import { ContextStore } from './context_store'

export interface Config {
  env: string
  logLevel: string
  port: string | number
  appStore?: AppStore
  cacheStore: CacheStore
  contextStore?: ContextStore
}

export let conf: Config = parseConfig(process.cwd())

export function parseConfig(cwd: string): Config {
  const env = getValue(process.env.FLY_ENV, process.env.NODE_ENV, 'development')
  const logLevel = getValue(process.env.FLY_LOG_LEVEL, process.env.LOG_LEVEL)
  const port = getValue(process.env.FLY_PORT, process.env.PORT, 3000)

  return {
    env: env,
    logLevel: logLevel || env === 'development' ? 'debug' : 'info',
    port: /^\d+$/.test(port) ? parseInt(port) : port,
    cacheStore: new MemoryCacheStore()
  }
}

function getValue(...values: any[]) {
  return values.find((v) => typeof v !== 'undefined')
}