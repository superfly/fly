import { ConfigStore } from '../config_store'
import { AppConfig } from '../app_config'
import * as path from 'path'
import * as fs from 'fs'
import * as YAML from 'js-yaml'

import * as webpack from 'webpack'
const MemoryFS = require('memory-fs')
const importCwd = require('import-cwd')

const webpackConfPath = "./webpack.config.js";
const webpackConfRequirePath = "./webpack.config";

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

    this.compiler = webpack(getWebpackConfig(cwd))
    this.compiler.outputFileSystem = new MemoryFS() // save in memory

    this.compiler.watch({}, (err: Error, stats: any) => {
      if (err) {
        console.error(err)
        return
      }
      if (stats.hasErrors()) {
        console.error(new Error(stats.toString({
          errorDetails: true,
          warnings: true
        })))
        return
      }

      if (stats.hash != this.codeHash) {
        console.log(`Compiled app bundle (hash: ${stats.hash})`)
        this.code = this.compiler.outputFileSystem.data['bundle.js'].toString()
        this.codeHash = stats.hash
      }
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

function getWebpackConfig(cwd: string) {
  let conf;
  if (fs.existsSync(path.join(cwd, webpackConfPath))) {
    console.log(`Using Webpack config ${webpackConfPath}`)
    conf = importCwd(webpackConfRequirePath)
  } else {
    console.log("Generating Webpack config...")
    conf = {
      entry: `${cwd}/index.js`,
      resolve: {
        extensions: ['.js']
      }
    }
  }
  conf.output = {
    filename: 'bundle.js',
    path: '/'
  }
  return conf
}