import * as path from 'path'
import * as fs from 'fs'

import * as webpack from 'webpack'

import { EventEmitter } from 'events'
import { createHash } from 'crypto'
import * as ivm from 'isolated-vm';



let v8EnvHash = "";
let v8EnvCode = "";
let v8EnvSourceMap = "";
let v8EnvSnapshot: ivm.ExternalCopy<ArrayBuffer>;

const v8dist = path.join(__dirname, '..', 'dist', 'v8env.js')
const v8distSnapshot = path.join(__dirname, '..', 'dist', 'v8env.bin')
const v8mapDist = path.join(__dirname, '..', 'dist', 'v8env.map.json')

if (fs.existsSync(v8dist)) {
  v8EnvCode = fs.readFileSync(v8dist).toString()
  v8EnvHash = createHash("sha1").update(v8EnvCode).digest("hex")
}

if (fs.existsSync(v8distSnapshot)) {
  v8EnvSnapshot = new ivm.ExternalCopy(<ArrayBuffer>fs.readFileSync(v8distSnapshot).buffer)
} else if (v8EnvCode) {
  v8EnvSnapshot = ivm.Isolate.createSnapshot([{
    code: v8EnvCode,
    filename: 'dist/v8env.js'
  }])
}

if (fs.existsSync(v8mapDist)) {
  v8EnvSourceMap = fs.readFileSync(v8mapDist).toString()
}

export class V8Environment extends EventEmitter {
  bootstrapped: boolean
  constructor() {
    super()
    this.bootstrapped = false
    if (!v8EnvCode)
      throw new Error("v8env not found, please run npm build to generate it")
  }

  get isReady() {
    return !!v8Env && !!v8EnvSnapshot
  }

  get source() {
    return v8EnvCode
  }

  get snapshot() {
    return v8EnvSnapshot
  }

  get sourceMap() {
    return v8EnvSourceMap
  }

  startUpdater() {
    try {
      console.log("Watching for changes:", v8dist)
      let fsTimeout = false
      fs.watch(v8dist, (eventType, fileName) => {
        fs.readFile(v8dist, (err, data) => {
          const s = data.toString()
          if (data && data.byteLength > 0) {
            v8Env.updateV8Env(data.toString())
          }
        })
      })
    } catch (e) {
      this.emit('error', e)
    }
  }

  updateV8Env(code?: string) {
    if (!code) {
      code = fs.readFileSync(v8dist).toString()
    }
    const hash = createHash('sha').update(code).digest("hex")
    if (hash != v8EnvHash) {
      const wasReady = this.isReady
      v8EnvCode = code
      v8EnvHash = hash
      v8EnvSourceMap = fs.readFileSync(v8mapDist).toString()
      console.log(`Loaded v8 env bundle (hash: ${v8EnvHash})`)
      this.emit('update', v8EnvCode)
      v8EnvSnapshot = ivm.Isolate.createSnapshot([{
        code: v8EnvCode,
        filename: 'dist/v8env.js'
      }])
      this.emit('snapshot', v8EnvSnapshot)
      if (!wasReady)
        this.emit('ready')
    }
  }

}

export let v8Env = new V8Environment()