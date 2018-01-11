import { conf } from './config'

import * as path from 'path'
import * as fs from 'fs'

import * as webpack from 'webpack'
const MemoryFS = require('memory-fs')

let v8EnvHash = "";
let v8Env = "";

const v8EnvEntry = require.resolve("../v8env/index")

let compiler = webpack({
  entry: v8EnvEntry,
  output: {
    filename: 'v8env.js',
    path: '/' // memoryfs!
  },
  resolve: {
    modules: ["../node_modules"]
  }
})

compiler.outputFileSystem = new MemoryFS()

export function getV8Env(callback: Function) {
  if (conf.env === 'development')
    compiler.watch({}, updateV8Env(callback))
  else
    compiler.run(updateV8Env(callback))
}

function updateV8Env(callback: Function) {
  return function (err: Error, stats: any) {
    if (err) {
      return callback(err)
    }
    if (stats.hasErrors()) {
      return callback(new Error(stats.toString({
        errorDetails: true,
        warnings: true
      })))
    }

    if (stats.hash != v8EnvHash) {
      console.log(`Compiled new v8 env bundle (hash: ${stats.hash})`)
      v8Env = compiler.outputFileSystem.data['v8env.js'].toString()
      v8EnvHash = stats.hash
      callback(null, v8Env)
    }
  }
}