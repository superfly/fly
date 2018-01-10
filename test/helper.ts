process.env.LOG_LEVEL || (process.env.LOG_LEVEL = 'info')

//ensure we're set to test at all times
process.env.NODE_ENV = 'test'
import 'mocha';

import * as promiseFinally from 'promise.prototype.finally'
promiseFinally.shim()

import { createIsoPool, IsolatePool } from '../src/isolate'
import { Server } from '../src/server'
import { conf } from '../src/config'
import * as ivm from 'isolated-vm'
import * as fs from 'fs'
import axios from 'axios'
axios.defaults.validateStatus = undefined

import { FileStore, FileStoreOptions } from '../src/config_stores/file'

const Replay = require('replay');
Replay.fixtures = __dirname + '/fixtures/replay';
Replay.headers.push(/^fly-/);

let isoPool: IsolatePool;

export async function startServer(cwd: string, options?: FileStoreOptions) {
  options || (options = { build: false })
  cwd = `./test/fixtures/apps/${cwd}`
  let store = new FileStore(cwd, options)

  conf.configStore = store
  conf.isoPool = isoPool

  const server = new Server(conf).server

  server.on('error', (e) => { throw e })

  await new Promise((resolve, reject) => {
    server.listen(3333, () => resolve())
  })

  return server
}

before(async function () {
  isoPool = await createIsoPool()
})