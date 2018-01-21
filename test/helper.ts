process.env.LOG_LEVEL || (process.env.LOG_LEVEL = 'info')

//ensure we're set to test at all times
process.env.NODE_ENV = 'test'
import 'mocha';

import * as promiseFinally from 'promise.prototype.finally'
promiseFinally.shim()

import { createIsoPool, IsolatePool } from '../src/isolate'
import { Server } from '../src/server'
import { parseConfig } from '../src/config'
import * as ivm from 'isolated-vm'
import * as fs from 'fs'
import axios from 'axios'
axios.defaults.validateStatus = undefined

import { FileStore, FileStoreOptions } from '../src/app/stores/file'

const Replay = require('replay');
Replay.fixtures = __dirname + '/fixtures/replay';
Replay.headers.push(/^fly-/);

let isoPool: IsolatePool;

interface ServerOptions extends FileStoreOptions {
  port?: number
}

export async function startServer(cwd: string, options?: ServerOptions) {
  options || (options = { build: false })
  cwd = `./test/fixtures/apps/${cwd}`
  let store = new FileStore(cwd, options)
  let port = options.port
  if(!port || port == 0){
    port = 3333
  }

  let conf = parseConfig(cwd)

  conf.appStore = store

  const server = new Server(conf, { isoPool }).server

  server.on('error', (e) => { throw e })

  await new Promise((resolve, reject) => {
    server.listen(port, () => resolve())
  })

  return server
}

before(async function () {
  isoPool = await createIsoPool()
})