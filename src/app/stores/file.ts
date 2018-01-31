import { AppStore } from '../store'
import { App, ReleaseInfo } from '../'
import * as path from 'path'
import fs = require('fs-extra')

import { buildApp } from '../../utils/build'
import { getLocalConfig, getLocalSecrets } from '../config'

import * as webpack from 'webpack'
const MemoryFS = require('memory-fs')
const importCwd = require('import-cwd')

export interface FileStoreOptions {
  build?: boolean
  noWatch?: boolean
  config?: any
  secrets?: any
}

export class FileStore implements AppStore {
  cwd: string
  compiler: webpack.Compiler

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
    }, getLocalConfig(cwd))

    if (this.options.config)
      this.releaseInfo.config = this.options.config
    if (this.options.secrets)
      this.releaseInfo.secrets = this.options.secrets

    const flyYmlPath = path.join(cwd, '.fly.yml')
    const flySecretsPath = path.join(cwd, '.fly.secrets.yml')

    if (options.noWatch != true) {
      if (fs.existsSync(flyYmlPath))
        fs.watch(flyYmlPath, (event: string, filename?: string) => {
          if (event === 'change')
            this.releaseInfo.config = getLocalConfig(cwd)
        })

      if (fs.existsSync(flySecretsPath))
        fs.watch(flySecretsPath, (event: string, filename?: string) => {
          if (event === 'change')
            this.releaseInfo.secrets = getLocalSecrets(cwd)
        })
    }

    if (!options.build) {
      let fullPath = cwd
      if (stat.isDirectory())
        fullPath = path.resolve(cwd, './index.js')
      if (!fs.existsSync(fullPath))
        throw new Error("no code to use")
      this.releaseInfo.source = fs.readFileSync(fullPath).toString()
      return
    }

    buildApp(cwd, { watch: true }, (err: Error, code: string, hash: string) => {
      if (err)
        return console.error(err)
      this.releaseInfo.source = code
      this.releaseInfo.source_hash = hash
    })
  }

  async getAppByHostname(hostname: string) {
    return new App(this.releaseInfo)
  }
}