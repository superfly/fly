import Parser from "./parser";
import { COMMAND, OPTION } from './argTypes'
import { getLocalRelease } from '../utils/local'

import YAML = require('js-yaml')
import fs = require('fs-extra')
import path = require('path')

const { version } = require('../../package.json')

export interface CommonOptions {
  app?: string[]
  env?: string[]
  token: string[]
}

export const root = new Parser("Fly CLI", [
  {
    type: COMMAND,
    name: 'version',
    description: 'The current version of Fly CLI',
    action: () => console.log(version)
  },
  {
    type: OPTION,
    name: 'app',
    accepts: 1, //number of arguments this accepts (in this case just 1 <id>)
    description: "App to use for commands."
  },
  {
    type: OPTION,
    name: 'env',
    accepts: 1,
    description: "Environment to use for commands."
  },
  {
    type: OPTION,
    name: 'token',
    accepts: 1,
    description: "Fly Access Token (can be set via environment FLY_ACCESS_TOKEN)"
  }
])

export function getToken() {
  let opts = root.getOptions(false)
  let token = opts.token || process.env.FLY_ACCESS_TOKEN
  if (!token) {
    try {
      const creds = getCredentials()
      if (creds)
        return creds.access_token
    } catch (e) {
      // do nothing
    }
  }

  if (!token) {
    throw new Error("--token option or environment variable FLY_ACCESS_TOKEN needs to be set.")
  }
  return token
}

export const fullAppMatch = /([a-z0-9_.-]+)/i

export function getAppName(env?: string) {
  let opts = root.getOptions(false)
  const cwd = process.cwd()
  env = process.env.FLY_ENV || env || opts.env || "production"
  const release = getLocalRelease(cwd, env, { noWatch: true })
  const appName = opts.app || release.app

  if (!appName) {
    throw new Error("--app option or app (in your .fly.yml) needs to be set.")
  }

  if (!appName.match(fullAppMatch))
    throw new Error("app parameter needs to match a full org/app name (ie: your-org/app-name)")

  return appName
}

export function homeConfigPath() {
  const home = getUserHome()
  if (!home)
    throw new Error("Where is your HOME? Please set the HOME environment variable and try again.")
  const homepath = path.join(home, ".fly")
  fs.mkdirpSync(homepath)
  return homepath
}

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function getCredentials() {
  const credspath = path.join(homeConfigPath(), "credentials.yml")
  if (!fs.existsSync(credspath))
    return
  return YAML.load(fs.readFileSync(credspath).toString())
}
