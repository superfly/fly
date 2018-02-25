process.env.LOG_LEVEL || (process.env.LOG_LEVEL = 'info')

//ensure we're set to test at all times
process.env.NODE_ENV = 'test'
import 'mocha';

import * as promiseFinally from 'promise.prototype.finally'
promiseFinally.shim()

import { Server } from '../src/server'
import { parseConfig } from '../src/config'
import log from "../src/log"
import * as fs from 'fs'
import axios from 'axios'
axios.defaults.validateStatus = undefined

import http = require('http')

import { FileStore, FileStoreOptions } from '../src/app/stores/file'
import { DefaultContextStore } from '../src/default_context_store';
import { MemoryCacheStore } from '../src/caches/memory';

const Replay = require('replay');
Replay.fixtures = './test/fixtures/replay';
Replay.headers.push(/^fly-/);

export interface ServerOptions extends FileStoreOptions {
  port?: number
}

export const contextStore = new DefaultContextStore()
export const cacheStore = new MemoryCacheStore("test cache")

export async function startServer(cwd: string, options?: ServerOptions): Promise<http.Server> {
  options || (options = {})
  Object.assign(options, { build: false, noWatch: true })
  cwd = `./test/fixtures/apps/${cwd}`
  let appStore = new FileStore(cwd, options)
  let port = options.port
  if (!port || port == 0) {
    port = 3333
  }

  let conf = parseConfig(cwd)

  conf.appStore = appStore

  const server = new Server(Object.assign({}, conf, { contextStore, appStore, cacheStore }))
  const http = server.server

  http.on('error', (e) => { throw e })

  await new Promise((resolve) => http.listen(port, resolve))

  return http
}

before(async function () {
  this.timeout(10000) // give this a chance
  await contextStore.getIsolate()
})