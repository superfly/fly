import * as fs from 'fs'
import * as path from 'path'
import * as YAML from 'js-yaml'

const cwd = process.cwd()

export let flyConf: any = {}

export function parseFlyConfig(cwd?: string) {
  cwd || (cwd = process.cwd())
  let conf = parseYAML(path.join(cwd, './.fly.yml'))
  let secrets = parseYAML(path.join(cwd, './.fly.secrets.yml'))

  applySecrets(conf.app || {}, secrets)

  return conf
}

function parseYAML(fullPath: string) {
  return fs.existsSync(fullPath) ?
    YAML.load(fs.readFileSync(fullPath).toString()) :
    {}
}

const fromSecretKey = 'fromSecret'
const fromEnvKey = 'fromEnv'
const defaultKey = 'default'

function applySecrets(obj: any, secrets: any) {
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'object')
      if (typeof obj[fromSecretKey] !== 'undefined')
        if (typeof secrets[k] !== 'undefined')
          obj[k] = secrets[obj[fromSecretKey]]
        else if (typeof obj[defaultKey] !== 'undefined')
          obj[k] = secrets[obj[defaultKey]]
        else
          throw new Error(`Expected secret '${obj[fromSecretKey]}' to be defined in our secrets file`)
      else if (typeof obj[fromEnvKey] !== 'undefined')
        if (process.env[obj[fromEnvKey]])
          obj[k] = process.env[obj[fromEnvKey]]
        else if (typeof obj[defaultKey] !== 'undefined')
          obj[k] = secrets[obj[defaultKey]]
        else
          throw new Error(`Expected setting '${obj[fromEnvKey]}' to be defined in your environment.`)
      else
        applySecrets(obj[k], secrets)
  }
}