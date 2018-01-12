import { conf } from '../config'
import * as path from 'path'
import { FileStore } from '../app/stores/file'
import { createIsoPool } from '../isolate'
import { Server } from '../server'

import { CommanderStatic } from 'commander';

export function startServer(prg: CommanderStatic) {
  if (prg.port) { conf.port = prg.port }

  const cwd = !prg.args[0]
    ? process.cwd()
    : prg.args[0].startsWith('/')
      ? prg.args[0]
      : path.resolve(process.cwd(), prg.args[0])

  conf.appStore = new FileStore(cwd, { build: true })

  new Server(conf, { isoPoolMin: 5, isoPoolMax: 20 }).start()
}