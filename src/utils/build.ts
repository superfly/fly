import * as fs from 'fs'
import * as path from 'path'
import * as webpack from 'webpack'

import log from '../log'
import { config } from 'bluebird';

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const webpackConfPath = "./webpack.fly.config.js";
const webpackConfRequirePath = "./webpack.fly.config";

export interface AppBuilderOptions {
  watch: boolean,
  uglify?: boolean
}

export function buildApp(cwd: string, opts: AppBuilderOptions, callback: Function) {
  buildAppWithConfig(cwd, getWebpackConfig(cwd, opts), opts, callback)
}

export function buildAppWithConfig(cwd: string, config: webpack.Configuration, opts: AppBuilderOptions, callback: Function) {
  console.log("Compiling app w/ options:", opts)
  let compiler = webpack(config)

  const cb = compileCallback(cwd, compiler, callback)

  if (opts.watch)
    return compiler.watch({}, cb)

  compiler.run(cb)
}

function compileCallback(cwd: string, compiler: webpack.Compiler, callback: Function) {
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
      const source = fs.readFileSync(path.resolve(cwd, '.fly/build/bundle.js'))
      const sourceMap = fs.readFileSync(path.resolve(cwd, '.fly/build/bundle.map.json'))
      codeHash = stats.hash
      log.debug("Compiled size: ", source.byteLength / (1024 * 1024), "MB")
      log.debug("Compiled sourcemap size: ", sourceMap.byteLength / (1024 * 1024), "MB")

      const sanitizedSourceMap = sourceMap
        .toString('utf8')
        .replace("\u2028", "\\u2028") // ugh.
        .replace("\u2029", "\\u2029")

      fs.writeFileSync(path.resolve(cwd, '.fly/build/bundle.map.json'), sanitizedSourceMap)

      callback(null,
        source.toString('utf8'),
        codeHash,
        sanitizedSourceMap
      )
    }
  }
}

export function getWebpackConfig(cwd: string, opts?: AppBuilderOptions): webpack.Configuration {
  let conf;
  const defaultPathToWebpackConfig = path.join(cwd, webpackConfPath)
  if (fs.existsSync(defaultPathToWebpackConfig)) {
    console.log(`Using Webpack config ${webpackConfPath}`)
    conf = require(defaultPathToWebpackConfig)
  } else {
    console.log("Generating Webpack config...")
    conf = {
      entry: `${cwd}/index.js`,
      resolve: {
        extensions: ['.js']
      }
    }
  }
  conf.entry = conf.entry || `${cwd}/index.js`
  conf.resolve = conf.resolve || {
    extensions: ['.js']
  }
  conf.devtool = 'source-map'
  conf.output = {
    filename: 'bundle.js',
    path: path.resolve(cwd, '.fly/build'),
    hashFunction: 'sha1',
    hashDigestLength: 40,
    sourceMapFilename: 'bundle.map.json',
  }

  let v8EnvPath = path.resolve(__filename, "../../../v8env/lib")

  conf.resolve = Object.assign({
    alias: Object.assign({}, conf.resolve.alias, {
      "@fly/image": v8EnvPath + "/fly/image",
      "@fly/proxy": v8EnvPath + "/fly/proxy"
    })
  }, conf.resolve)

  if (opts && opts.uglify) {
    conf.plugins = conf.plugins || []
    conf.plugins.push(new UglifyJsPlugin({
      parallel: true,
      sourceMap: true,
      uglifyOptions: {
        output: { ascii_only: true },
        mangle: false
      }
    }))
  }
  return conf
}