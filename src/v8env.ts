import { runtimeConfig } from './config'

import * as path from 'path'
import * as fs from 'fs'

import * as webpack from 'webpack'

import { EventEmitter } from 'events'
import { createHash } from 'crypto'
import * as ivm from 'isolated-vm';

const MemoryFS = require('memory-fs')

let v8EnvHash = "";
let v8EnvCode = "";
let v8EnvSourceMap = "";
let v8EnvSnapshot: ivm.ExternalCopy<ArrayBuffer>;

const v8EnvEntry = require.resolve("../v8env/index")
const v8dist = path.join(__dirname, '..', 'dist', 'v8env.js')
const v8mapDist = path.join(__dirname, '..', 'dist', 'v8env.map.js')

let compiler = webpack(<any>{
  entry: v8EnvEntry,
  devtool: 'source-map',
  output: {
    filename: 'v8env.js',
    sourceMapFilename: 'v8env.map.json',
    hashFunction: 'sha1',
    hashDigestLength: 40,
    path: __dirname + '/../dist/'
  },
  resolve: {
    modules: ["../node_modules"]
  },
  module: {
    loaders: [
      { test: /\.tsx?/, loader: "ts-loader"}
    ]
  }
})

//compiler.outputFileSystem = new MemoryFS()

export class V8Environment extends EventEmitter {
  constructor() {
    super()

    if(!fs.existsSync(v8dist)){
      this.startCompiler(() => this.bootstrap())
    }else{
      this.bootstrap()
    }
  }

  get isReady() {
    return !!v8Env && !!v8EnvSnapshot
  }

  get snapshot() {
    return v8EnvSnapshot
  }

  get sourceMap() {
    return v8EnvSourceMap
  }
  bootstrap(){
    setImmediate(() => {
      if (runtimeConfig.env === 'development')
        this.startUpdater()
      this.updateV8Env()
    })
  }

  waitForReadiness() {
    if (this.isReady)
      return Promise.resolve()
    return new Promise((resolve, reject) => {
      this.once('ready', () => {
        this.removeListener('error', reject)
        resolve()
      })
      this.once('error', reject)
    })
  }

  startCompiler(cb: Function) {
    const callback = (err: Error, stats: any) => {
          if(err){
            return this.emit('error', err)
          }

          if (stats.hasErrors()) {
            return this.emit('error', new Error(stats.toString({
              errorDetails: true,
              warnings: true
            })))
          } 
          console.log("Compiled v8env:", stats.hash)
          cb()
        }
    try {
      if (runtimeConfig.env === 'development')
        compiler.watch({}, callback)
      else
        compiler.run(callback)
    } catch (e) {
      this.emit('error', e)
    }
  }

  startUpdater(){
    try {
      fs.watch(v8dist, (eventType, fileName) => {
        this.updateV8Env.bind(this)
      })
    } catch (e) {
      this.emit('error', e)
    }
  }

  updateV8Env(hash?: string) {
    if (hash != v8EnvHash) {
      const wasReady = this.isReady
      v8EnvCode = fs.readFileSync(v8dist).toString()
      v8EnvHash = createHash('md5').update(v8EnvCode).digest("hex")
      v8EnvSourceMap = fs.readFileSync(v8mapDist).toString()
      console.log(`Loaded v8 env bundle (hash: ${v8EnvHash})`)
      this.emit('update', v8EnvCode)
      v8EnvSnapshot = ivm.Isolate.createSnapshot([{
        code: v8EnvCode + `\n;
        sourceMaps["v8env.js"] = {
          filename: "v8env.map.json",
          map: ${v8EnvSourceMap}
        }`,
        filename: 'v8env.js'
      }], "bootstrap();")
      this.emit('snapshot', v8EnvSnapshot)
      if (!wasReady)
        this.emit('ready')
    }
  }

}

export let v8Env = new V8Environment()