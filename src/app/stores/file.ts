import { AppStore } from '../store'
import { App, ReleaseInfo } from '../../app'
import * as path from 'path'
import fs = require('fs-extra')

import { buildApp } from '../../utils/build'
import { getLocalConfig, getLocalSecrets, parseConfig } from '../config'

import * as webpack from 'webpack'
const MemoryFS = require('memory-fs')
const importCwd = require('import-cwd')

export interface FileStoreOptions {
  build?: boolean
  noWatch?: boolean
  noSource?: boolean
  config?: any
  secrets?: any
  uglify?: boolean
}

export class FileStore implements AppStore {
  cwd: string

  releaseInfo: ReleaseInfo

  options: FileStoreOptions

  constructor(cwd: string, options: FileStoreOptions = {}) {
    this.options = options
    this.cwd = cwd

    if (!fs.existsSync(cwd))
      throw new Error("Could not find path: " + cwd)

    const stat = fs.statSync(cwd)

    this.releaseInfo = Object.assign({}, {
      app_id: this.cwd,
      version: 0,
      source: "",
      source_hash: "",
      config: {},
      secrets: {},
    }, getLocalConfig(cwd), { secrets: getLocalSecrets(cwd) })

    if (this.options.config)
      this.releaseInfo.config = this.options.config
    if (this.options.secrets)
      this.releaseInfo.secrets = this.options.secrets

    parseConfig(this.releaseInfo.config, this.releaseInfo.secrets)

    const flyYmlPath = path.join(cwd, '.fly.yml')
    const flySecretsPath = path.join(cwd, '.fly.secrets.yml')

    if (options.noWatch != true) {
      if (fs.existsSync(flyYmlPath))
        fs.watch(flyYmlPath, (event: string, filename?: string) => {
          if (event === 'change') {
            console.log("Detected .fly.yml change, updating in-memory config.")
            try {
              this.releaseInfo.config = getLocalConfig(cwd).config || {}
              parseConfig(this.releaseInfo.config, this.releaseInfo.secrets)
            } catch (e) {
              console.error(e)
            }
          }
        })

      if (fs.existsSync(flySecretsPath))
        fs.watch(flySecretsPath, (event: string, filename?: string) => {
          if (event === 'change') {
            console.log("Detected .fly.secrets.yml change, updating in-memory config.")
            try {
              this.releaseInfo.secrets = getLocalSecrets(cwd)
              parseConfig(this.releaseInfo.config, this.releaseInfo.secrets)
            } catch (e) {
              console.error(e)
            }
          }
        })
    }

    if (options.noSource)
      return

    if (!options.build) {
      let fullPath = cwd
      if (stat.isDirectory())
        fullPath = path.resolve(cwd, './index.js')
      if (!fs.existsSync(fullPath))
        throw new Error("no code to use")
      this.releaseInfo.source = fs.readFileSync(fullPath).toString()
      return
    }

    buildApp(cwd, { watch: true, uglify: this.options.uglify }, (err: Error, code: string, hash: string, sourceMap: string) => {
      if (err)
        return console.error(err)

      this.releaseInfo.source = code
      this.releaseInfo.source_hash = hash
      this.releaseInfo.source_map = sourceMap
    })
  }

  async getAppByHostname(hostname: string) {
    return new App(this.releaseInfo)
  }

  stop() { }
}