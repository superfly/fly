import path = require('path')
import YAML = require('js-yaml')
import fs = require('fs-extra')

const fromSecretKey = 'fromSecret'
const fromEnvKey = 'fromEnv'
const defaultKey = 'default'

export function parseConfig(config: any, secrets: any) {
  if (!config)
    return
  for (const k of Object.keys(config)) {
    if (!!config[k] && typeof config[k] === 'object') {
      if (typeof config[k][fromSecretKey] === 'string') {
        if (typeof secrets[config[k][fromSecretKey]] !== 'undefined') {
          config[k] = secrets[config[k][fromSecretKey]]
        } else
          throw new Error(`Expected secret '${config[k][fromSecretKey]}' to be defined in secrets`)
      } else
        parseConfig(config[k], secrets)
    }
  }
}
