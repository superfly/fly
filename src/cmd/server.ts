import { root } from './root'
import { Command } from 'commandpost/lib';

interface ServerOptions {
  port?: string
  inspect?: boolean
  uglify: boolean
}

interface ServerArguments {
  path?: string
}

root
  .subCommand<ServerOptions, ServerArguments>("server [path]")
  .description("Run the local Fly development server")
  .option("-p, --port <port>", "Port to bind to")
  .option("--inspect", "use the v8 inspector on your fly app")
  .option("--uglify", "uglify your code like we'll use in production (warning: slow!)")
  .action(function (this: Command<ServerOptions, ServerArguments>, opts, args, rest) {
    const { FileAppStore } = require('../file_app_store')
    const { Server } = require('../server')

    const cwd = args.path || process.cwd()
    console.log(`Using ${cwd} as working directory.`)

    const port = opts.port && opts.port[0] || 3000

    // TODO: use env option for environment.
    const appStore = new FileAppStore(cwd, { build: true, uglify: opts.uglify, env: "development" })

    const server = new Server({ appStore, inspect: !!opts.inspect })
    server.listen(port)
  })