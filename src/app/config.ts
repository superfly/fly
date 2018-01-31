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
    if (typeof config[k] === 'object')
      if (typeof config[fromSecretKey] !== 'undefined')
        if (typeof secrets[k] !== 'undefined')
          config[k] = secrets[config[fromSecretKey]]
        else if (typeof config[defaultKey] !== 'undefined')
          config[k] = secrets[config[defaultKey]]
        else
          throw new Error(`Expected secret '${config[fromSecretKey]}' to be defined in our secrets file`)
      // else if (typeof config[fromEnvKey] !== 'undefined')
      //   if (process.env[config[fromEnvKey]])
      //     config[k] = process.env[config[fromEnvKey]]
      //   else if (typeof config[defaultKey] !== 'undefined')
      //     config[k] = secrets[config[defaultKey]]
      //   else
      //     throw new Error(`Expected setting '${config[fromEnvKey]}' to be defined in your environment.`)
      else
        parseConfig(config[k], secrets)
  }
}

export function getLocalSecrets(cwd = process.cwd()) {
  const localSecretsPath = path.join(cwd, ".fly.secrets.yml")
  let secrets = {};

  if (fs.existsSync(localSecretsPath))
    secrets = YAML.load(fs.readFileSync(localSecretsPath).toString())

  return secrets
}

export function getLocalConfig(
  cwd = process.cwd(),
  env = process.env.FLY_ENV || process.env.NODE_ENV || 'development'
) {
  const localConfigPath = path.join(cwd, ".fly.yml")
  let config: any = {};
  if (fs.existsSync(localConfigPath))
    config = YAML.load(fs.readFileSync(localConfigPath).toString())

  return config[env] || config
}