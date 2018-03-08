import { AppStore } from './app_store'
import { App, Release } from './app'
import * as path from 'path'
import * as fs from 'fs-extra'
import * as YAML from 'js-yaml'

import { buildApp } from './utils/build'
import { parseConfig } from './config'
import { getEnv, getLocalRelease, LocalRelease } from './utils/local'

import * as webpack from 'webpack'
import { LocalFileStore } from './local_file_store';

export interface FileAppStoreOptions {
  build?: boolean
  noWatch?: boolean
  noSource?: boolean
  config?: any
  secrets?: any
  uglify?: boolean
  env?: string
  noReleaseReuse?: boolean
}

export class FileAppStore implements AppStore {
  cwd: string

  release: LocalRelease

  options: FileAppStoreOptions

  constructor(cwd: string, options: FileAppStoreOptions = {}) {
    this.cwd = cwd
    this.options = options

    if (!fs.existsSync(cwd))
      throw new Error("Could not find path: " + cwd)

    const stat = fs.statSync(cwd)
    if (!stat.isDirectory())
      this.cwd = path.dirname(cwd)

    const env = options.env || getEnv()

    if (options.noReleaseReuse)
      this.release = new LocalRelease(cwd, env, { noWatch: options.noWatch })
    else
      this.release = getLocalRelease(cwd, env, { noWatch: options.noWatch })

    // const localConf = getLocalConfig(cwd, env)
    // const config = localConf.config

    // config.app = config.app || config.app_id

    // this.release = {
    //   app: this.cwd,
    //   version: 0,
    //   source: "",
    //   source_hash: "",
    //   config: config,
    //   secrets: {},
    //   env: env,
    // }

    if (this.options.config)
      this.release.config = this.options.config
    if (this.options.secrets)
      this.release.secrets = this.options.secrets

    if (options.noSource)
      return

    if (!options.build) {
      let fullPath = cwd
      if (stat.isDirectory())
        fullPath = path.resolve(cwd, './index.js')
      if (!fs.existsSync(fullPath))
        throw new Error("no code to use")
      this.release.source = fs.readFileSync(fullPath).toString()
      return
    }

    buildApp(cwd, { watch: true, uglify: this.options.uglify }, (err: Error, code: string, hash: string, sourceMap: string) => {
      if (err)
        return console.error(err)

      this.release.source = code
      this.release.source_hash = hash
      this.release.source_map = sourceMap
    })
  }

  async getAppByHostname(hostname: string) {
    const app = new App(this.release)
    app.fileStore = new LocalFileStore(this.cwd, this.release)
    return app
  }

  stop() { }
}
