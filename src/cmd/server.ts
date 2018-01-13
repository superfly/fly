import { parseConfig } from '../config'
import * as path from 'path'
import { createIsoPool } from '../isolate'
import { Server } from '../server'
import { FileStore } from '../app/stores/file'

import { CommanderStatic } from 'commander';

export function startServer(prg: CommanderStatic) {
  const cwd = !prg.args[0]
    ? process.cwd()
    : prg.args[0].startsWith('/')
      ? prg.args[0]
      : path.resolve(process.cwd(), prg.args[0])

  let conf = parseConfig(cwd)

  if (prg.port) { conf.port = prg.port }

  conf.appStore = new FileStore(cwd, { build: true })

  new Server(conf, { isoPoolMin: 5, isoPoolMax: 20 }).start()
}