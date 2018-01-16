import { AppStore } from '../store'
import { App } from '../'
import * as path from 'path'
import * as fs from 'fs'

import { parseFlyConfig } from '../../fly_config'

import { buildApp } from '../../utils/build'

import * as webpack from 'webpack'
const MemoryFS = require('memory-fs')
const importCwd = require('import-cwd')

export interface FileStoreOptions {
  build?: boolean
  appConfig?: any
}

export class FileStore implements AppStore {
  cwd: string
  compiler: webpack.Compiler

  code: string
  codeHash: string

  cachedApp: App

  options: FileStoreOptions

  constructor(cwd: string, options?: any) {
    this.options = options || <FileStoreOptions>{}
    this.cwd = cwd

    if (!fs.existsSync(cwd))
      throw new Error("Could not find path: " + cwd)

    const stat = fs.statSync(cwd)

    if (options && !options.build) {
      let fullPath = cwd
      if (stat.isDirectory())
        fullPath = path.resolve(cwd, './index.js')
      if (!fs.existsSync(fullPath))
        return
      this.code = fs.readFileSync(fullPath).toString()
      return
    }

    buildApp(cwd, { watch: true }, (err: Error, code: string) => {
      if (err)
        return console.error(err)
      this.code = code
      if (this.cachedApp)
        this.cachedApp.code = code
    })
  }

  async getAppByHostname(hostname: string) {
    if (this.cachedApp)
      return this.cachedApp

    const flyConf = this.options.appConfig ?
      { app: this.options.appConfig } :
      parseFlyConfig(this.cwd)

    let app = new App(flyConf.app || {})
    app.code = this.code
    this.cachedApp = app
    return app
  }
}