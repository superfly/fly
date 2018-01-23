import { conf } from './config'

import * as path from 'path'
import * as fs from 'fs'

import * as webpack from 'webpack'

import { EventEmitter } from 'events'
import ivm = require('isolated-vm')

const MemoryFS = require('memory-fs')

let v8EnvHash = "";
let v8EnvCode = "";
let v8EnvSnapshot: ivm.ExternalCopy<ArrayBuffer>;

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

export class V8Environment extends EventEmitter {
  constructor() {
    super()
    this.startCodeUpdater()
  }

  get isReady() {
    return !!v8Env && !!v8EnvSnapshot
  }

  get snapshot() {
    return v8EnvSnapshot
  }

  waitForReadiness() {
    if (this.isReady)
      return Promise.resolve()
    return new Promise((resolve, reject) => {
      this.once('ready', resolve)
    })
  }

  startCodeUpdater() {
    if (conf.env === 'development')
      compiler.watch({}, this.updateV8Env.bind(this))
    else
      compiler.run(this.updateV8Env.bind(this))
  }

  updateV8Env(err: Error, stats: any) {
    if (err) {
      return this.emit('error', err)
    }
    if (stats.hasErrors()) {
      return this.emit('error', new Error(stats.toString({
        errorDetails: true,
        warnings: true
      })))
    }

    if (stats.hash != v8EnvHash) {
      console.log(`Compiled new v8 env bundle (hash: ${stats.hash})`)
      const wasReady = this.isReady
      v8EnvCode = compiler.outputFileSystem.data['v8env.js'].toString()
      v8EnvHash = stats.hash
      this.emit('update', v8EnvCode)
      v8EnvSnapshot = ivm.Isolate.createSnapshot([{
        code: v8EnvCode,
        filename: './v8env.js'
      }])
      this.emit('snapshot', v8EnvSnapshot)
      if (!wasReady)
        this.emit('ready')
    }
  }

}

export let v8Env = new V8Environment()