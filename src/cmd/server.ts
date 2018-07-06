import { root } from './root'
import { Command } from 'commandpost/lib';
import * as path from 'path'
import * as fs from 'fs'
import { spawn } from 'child_process'

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
  .action(async function (this: Command<ServerOptions, ServerArguments>, opts, args, rest) {
    const { FileAppStore } = require('../file_app_store')
    const { Server } = require('../server')

    let cwd = args.path || process.cwd()
    if (!fs.existsSync(cwd)) {
      cwd = await getExamplePath(cwd) || cwd
    }
    console.log(`Using ${cwd} as working directory.`)
    process.chdir(cwd)

    const port = (opts.port && opts.port[0]) || (process.env['PORT'] && process.env['PORT']) || 3000

    // TODO: use env option for environment.
    const appStore = new FileAppStore(cwd, { build: true, uglify: opts.uglify, env: "development" })

    const server = new Server({ appStore, inspect: !!opts.inspect })
    server.listen(port)
  })

async function getExamplePath(name: string) {
  const p = path.resolve(__dirname, "..", "..", "examples", name)
  if (!fs.existsSync(p)) {
    return undefined
  }
  const packagePath = path.resolve(p, "package.json")
  const modulesPath = path.resolve(p, "node_modules")

  if (!fs.existsSync(packagePath)) {
    // no npm install needed
    return p
  }

  if (fs.existsSync(modulesPath)) {
    // node_modules already installed
    return p
  }
  // need to install modules
  return new Promise<string>((resolve, reject) => {
    console.log("installing example app packages")
    const npm = spawn('npm', ['install'], { cwd: p, env: process.env });
    npm.stdout.on('data', (data) => {
      console.log(`${data}`);
    });

    npm.stderr.on('data', (data) => {
      console.error(`${data}`);
    });

    npm.on('close', (code) => {
      console.log(`npm install exited with code ${code}`);
      resolve(p)
    });
  })
}