process.env.LOG_LEVEL || (process.env.LOG_LEVEL = 'info')

//ensure we're set to test at all times
process.env.NODE_ENV = 'test'
import 'mocha';

import * as promiseFinally from 'promise.prototype.finally'
promiseFinally.shim()

import { Server } from '../src/server'
import log from "../src/log"
import * as fs from 'fs'
import axios from 'axios'
axios.defaults.validateStatus = undefined

import http = require('http')

import { FileAppStore, FileAppStoreOptions } from '../src/file_app_store'
import { DefaultContextStore } from '../src/default_context_store';
import { MemoryCacheStore } from '../src/memory_cache_store';
import { Bridge } from '../src/bridge/bridge';
import { LocalFileStore } from '../src/local_file_store';
import { IHookCallbackContext } from 'mocha';

const Replay = require('replay');
Replay.fixtures = './test/fixtures/replay';
Replay.headers.push(/^fly-/);

export interface ServerOptions extends FileAppStoreOptions {
  port?: number
}

process.on("uncaughtException", function (err) {
  console.error(err.stack)
})

process.on("unhandledRejection", function (err) {
  console.error(err.stack)
})

export const contextStore = new DefaultContextStore()
export const cacheStore = new MemoryCacheStore("test cache")

export function startServer(cwd: string, options: ServerOptions = {}) {
  let port = options.port
  if (!port || port == 0) {
    port = 3333
  }
  return function (this: IHookCallbackContext, done: MochaDone) {
    this.server = makeServer(cwd, options)
    this.server.on('error', (e: Error) => { throw e })
    this.server.listen(port, done)
  }
}

export function stopServer(this: IHookCallbackContext, done: MochaDone) {
  this.server.close(done)
}

export function drainContexts(this: IHookCallbackContext, done: MochaDone) {
  contextStore.drain().then(() => done()).catch(done)
}

export function makeServer(cwd: string, options: ServerOptions = {}) {
  Object.assign(options, { build: false, noWatch: true, noReleaseReuse: true })
  cwd = `./test/fixtures/apps/${cwd}`
  let appStore = new FileAppStore(cwd, options)

  const bridge = new Bridge({ cacheStore: cacheStore, fileStore: new LocalFileStore(cwd, appStore.release) })
  return new Server({ appStore, contextStore, bridge })
}

before(async function () {
  this.timeout(10000) // give this a chance
  await contextStore.getIsolate()
})