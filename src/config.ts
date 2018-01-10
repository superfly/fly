import { IsolatePool } from './isolate'
import { ConfigStore } from './config_store'

export interface Config {
  env: string
  logLevel: string
  port: string | number
  isoPool?: IsolatePool
  configStore?: ConfigStore
}

const env = process.env.PROXY_ENV || process.env.NODE_ENV || "development"
const port = process.env.PROXY_PORT || "3000"

const logLevelFromEnv = process.env.LOG_LEVEL

let logLevel: string
if (logLevelFromEnv)
  logLevel = logLevelFromEnv
else
  logLevel = env === "development" ? "debug" : "info"

export let conf: Config = {
  env: env,
  logLevel: logLevel,
  port: /^\d+$/.test(port) ? parseInt(port) : port
}