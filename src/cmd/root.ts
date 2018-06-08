import { create, Command } from "commandpost";
import { getLocalRelease } from '../utils/local'

import YAML = require('js-yaml')
import fs = require('fs-extra')
import path = require('path')

const { version } = require('../../package.json')

export interface CommonOptions {
  app?: string[]
  env?: string[]
  token?: string[]
}

export const root =
  create<CommonOptions, any>("fly")
    .version(version, "-v, --version")
    .description("Fly CLI")

addCommonOptions(root)

export function addCommonOptions(cmd: Command<CommonOptions, any>) {
  cmd.option("-a, --app <id>", "App to use for commands.")
    .option("-e, --env <env>", "Environment to use for commands.")
    .option("--token <token>", "Fly Access Token (can be set via environment FLY_ACCESS_TOKEN)")
}

export function getToken(cmd: Command<any, CommonOptions>) {
  let token = recursivelyGetOption(cmd, 'token') || process.env.FLY_ACCESS_TOKEN
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

export const fullAppMatch = /^([a-z0-9_-]+)$/i

export function getEnv(cmd: Command<CommonOptions, any>): string {
  return process.env.FLY_ENV || recursivelyGetOption(cmd, 'env') || "production"
}

export function getAppName(cmd: Command<CommonOptions, any>) {
  const cwd = process.cwd()
  const env = getEnv(cmd)

  const release = getLocalRelease(cwd, env, { noWatch: true })
  const appName = recursivelyGetOption(cmd, 'app') || release.app

  if (!appName) {
    throw new Error("--app option or app (in your .fly.yml) needs to be set.")
  }

  if (!appName.match(fullAppMatch))
    throw new Error("app parameter needs to match an app name (ie: app-name)")

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

function recursivelyGetOption(cmd: Command<CommonOptions, any>, optName: string) {
  let currentCmd = cmd

  while (currentCmd) {
    const opts = (<any>currentCmd.parsedOpts)
    if (opts[optName] && !!opts[optName][0]) {
      return opts[optName][0]
    }
    currentCmd = currentCmd.parent
  }
}