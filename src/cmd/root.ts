import { create, Command } from "commandpost";
import { parseFlyConfig } from '../fly_config'

import YAML = require('js-yaml')
import fs = require('fs-extra')
import path = require('path')

const { version } = require('../../package.json')

export interface RootOptions {
  app?: string[];
  token: string[];
}

export interface RootArgs {
}

export const root =
  create<RootOptions, RootArgs>("fly")
    .version(version, "-v, --version")
    .description("Fly CLI")
    .option("-a, --app <id>", "App to use for commands.")
    .option("--token <token>", "Fly Access Token (can be set via environment FLY_ACCESS_TOKEN)")
// .action((opts, args) => {
//   console.log(`hello fly ${opts.app}`);
// });

export function getToken() {

  let token = root.parsedOpts.token[0] || process.env.FLY_ACCESS_TOKEN
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

export function getApp() {
  const conf = parseFlyConfig(process.cwd())
  const app = (root.parsedOpts.app && root.parsedOpts.app[0]) || conf.app && conf.app.id

  if (!app) {
    throw new Error("--app option or app.id (in your .fly.yml) needs to be set.")
  }
  return app
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