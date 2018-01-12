import { flyConf } from './fly_config'
import { AppStore } from './app/store'

export interface Config {
  env: string
  logLevel: string
  port: string | number
  appStore?: AppStore
}

export let conf = parseConfig()

function parseConfig(): Config {
  const env = getValue(process.env.FLY_ENV, process.env.NODE_ENV, flyConf.env, 'development')
  const logLevel = getValue(process.env.FLY_LOG_LEVEL, process.env.LOG_LEVEL, flyConf.log_level)
  const port = getValue(process.env.FLY_PORT, process.env.PORT, flyConf.port, 3000)

  return {
    env: env,
    logLevel: logLevel || env === 'development' ? 'debug' : 'info',
    port: /^\d+$/.test(port) ? parseInt(port) : port
  }
}

function getValue(...values: any[]) {
  return values.find((v) => typeof v !== 'undefined')
}