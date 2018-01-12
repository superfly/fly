import * as fs from 'fs'
import * as path from 'path'
import * as YAML from 'js-yaml'

const cwd = process.cwd()
const flyConfPath = path.join(cwd, '/.fly.yml')
const flySecretsPath = path.join(cwd, '/.fly.secrets.yml')

export let flyConf = fs.existsSync(flyConfPath) ?
  YAML.load(fs.readFileSync(flyConfPath).toString()) :
  {}

export let flySecrets = fs.existsSync(flySecretsPath) ?
  YAML.load(fs.readFileSync(flySecretsPath).toString()) :
  {}