import { ConfigStore } from '../config_store'
import { AppConfig } from '../app_config'
import * as path from 'path'
import * as fs from 'fs'
import * as YAML from 'js-yaml'

import { buildApp } from '../utils/build'

import * as webpack from 'webpack'
const MemoryFS = require('memory-fs')
const importCwd = require('import-cwd')

export interface FileStoreOptions {
  build?: boolean
}

export class FileStore implements ConfigStore {
  cwd: string
  compiler: webpack.Compiler

  code: string
  codeHash: string

  cachedApp: AppConfig

  constructor(cwd: string, options?: any) {
    this.cwd = cwd

    if (!fs.existsSync(cwd))
      throw new Error("Could not find path: " + cwd)

    const stat = fs.statSync(cwd)

    if (options && !options.build) {
      let fullPath = cwd
      if (stat.isDirectory())
        fullPath = path.resolve(cwd, './index.js')
      this.code = fs.readFileSync(fullPath).toString()
      return
    }

    buildApp(cwd, { watch: true }, (err: Error, code: string) => {
      if (err)
        return console.error(err)
      this.code = code
    })
  }

  async getConfigByHostname(hostname: string) {
    if (this.cachedApp)
      return this.cachedApp

    let conf = {}
    let pathToConfigYML = path.join(this.cwd, '.fly.yml')
    if (fs.existsSync(pathToConfigYML))
      conf = YAML.load(fs.readFileSync(pathToConfigYML).toString())

    let app = new AppConfig(conf)
    app.getCode = () => {
      return this.code
    }
    this.cachedApp = app
    return app
  }
}