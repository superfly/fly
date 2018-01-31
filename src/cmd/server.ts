import { parseConfig } from '../config'
import * as path from 'path'
import { Server } from '../server'
import { FileStore } from '../app/stores/file'

import { CommanderStatic } from 'commander';
import log from "../log"

export function startServer(prg: CommanderStatic) {
  const cwd = !prg.args[0]
    ? process.cwd()
    : prg.args[0].startsWith('/')
      ? prg.args[0]
      : path.resolve(process.cwd(), prg.args[0])

  let conf = parseConfig(cwd)

  if (prg.port) { conf.port = prg.port }

  conf.appStore = new FileStore(cwd, { build: true })

  const server = new Server(conf)
  server.addListener("requestEnd", (req, res, trace) => {
    log.debug(trace.report())
  })
  server.start()
}