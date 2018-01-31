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

const Replay = require('replay');
Replay.fixtures = './test/fixtures/replay';
Replay.headers.push(/^fly-/);


export interface ServerOptions extends FileStoreOptions {
  port?: number
}

const contextStore = new DefaultContextStore()

export async function startServer(cwd: string, options?: ServerOptions): Promise<http.Server> {
  options || (options = { build: false })
  cwd = `./test/fixtures/apps/${cwd}`
  let appStore = new FileStore(cwd, options)
  let port = options.port
  if (!port || port == 0) {
    port = 3333
  }

  let conf = parseConfig(cwd)

  conf.appStore = appStore

  const server = new Server(Object.assign({}, conf, { contextStore, appStore }))
  const http = server.server

  server.addListener("requestEnd", (req, res, trace) => {
    log.debug(trace.report())
  })

  http.on('error', (e) => { throw e })

  await new Promise((resolve, reject) => {
    http.listen(port, () => resolve())
  })

  return http
}

before(async function () {
  await contextStore.getIsolate()
})