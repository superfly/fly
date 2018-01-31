import * as fs from 'fs'
import * as path from 'path'
import * as webpack from 'webpack'

const importCwd = require('import-cwd')
const MemoryFS = require('memory-fs')

const webpackConfPath = "./webpack.config.js";
const webpackConfRequirePath = "./webpack.config";

export interface AppBuilderOptions {
  watch: boolean
}

export function buildApp(cwd: string, opts: AppBuilderOptions, callback: Function) {
  buildAppWithConfig(getWebpackConfig(cwd), opts, callback)
}

export function buildAppWithConfig(config: webpack.Configuration, opts: AppBuilderOptions, callback: Function) {
  let compiler = webpack(config)
  compiler.outputFileSystem = new MemoryFS() // save in memory

  const cb = compileCallback(compiler, callback)

  if (opts.watch)
    return compiler.watch({}, cb)

  compiler.run(cb)
}

function compileCallback(compiler: webpack.Compiler, callback: Function) {
  let codeHash: string;
  return function (err: Error, stats: any) {
    if (err) {
      callback(err)
      return
    }
    if (stats.hasErrors()) {
      callback(new Error(stats.toString({
        errorDetails: true,
        warnings: true
      })))
      return
    }

    if (stats.hash != codeHash) {
      console.log(`Compiled app bundle (hash: ${stats.hash})`)
      callback(null, compiler.outputFileSystem.data['bundle.js'].toString(), stats.hash)
      codeHash = stats.hash
    }
  }
}

export function getWebpackConfig(cwd: string): webpack.Configuration {
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