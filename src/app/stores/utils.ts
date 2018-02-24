import * as path from 'path'
import * as YAML from 'js-yaml'
import * as fs from 'fs-extra'

const secretsFile = ".fly.secrets.yml"
const configFile = ".fly.yml"

export function getLocalSecrets(cwd = process.cwd()) {
  const localSecretsPath = path.join(cwd, secretsFile)
  let secrets = {};

  if (fs.existsSync(localSecretsPath))
    secrets = YAML.load(fs.readFileSync(localSecretsPath).toString())

  return secrets
}

export function getLocalConfig(
  cwd = process.cwd(),
  env = getEnv()
) {
  const localConfigPath = path.join(cwd, configFile)
  let config: any = {};
  if (fs.existsSync(localConfigPath))
    config = YAML.load(fs.readFileSync(localConfigPath).toString())

  return config[env] || config
}

export function getEnv() {
  return process.env.FLY_ENV || process.env.NODE_ENV || 'development'
}
