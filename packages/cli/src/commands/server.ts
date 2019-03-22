// tslint:disable:no-shadowed-variable

import Command, { flags } from "@oclif/command"
import * as path from "path"
import * as fs from "fs"
import { spawn } from "child_process"
import { FileAppStore } from "@fly/core/lib/file_app_store"
import { Server } from "@fly/core/lib/server"
import { examplesPath } from "@fly/examples"
import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"

export default class ServerCmd extends FlyCommand {
  public static description = "run the local fly development server"

  public static flags = {
    env: sharedFlags.env(),
    port: flags.integer({
      char: "p",
      description: "Port to bind to",
      env: "PORT",
      default: 3000
    }),
    inspect: flags.boolean({
      description: "use the v8 inspector on your fly app",
      default: false
    }),
    uglify: flags.boolean({
      description: "uglify your code like we'll use in production (warning: slow!)",
      default: false
    })
  }

  static args = [{ name: "path", description: "path to app", default: "." }]

  public async run() {
    const { args, flags } = this.parse(this.ctor)
    let cwd = args.path || process.cwd()

    if (!fs.existsSync(cwd)) {
      cwd = (await getExamplePath(cwd)) || cwd
    }
    console.log(`Using ${cwd} as working directory.`)
    process.chdir(cwd)

    let port = flags.port!
    const env = flags.env!

    const appStore = new FileAppStore(cwd, {
      build: true,
      uglify: flags.uglify,
      env,
      noWatch: env === "test"
    })

    const server = new Server({ appStore, inspect: !!flags.inspect })
    console.log("Memory Cache Adapter: " + server.bridge.cacheStore.constructor.name)
    if (server.bridge.blobStore) {
      console.log(`Blob Cache Adapter: ${server.bridge.blobStore}`)
    }
    if (port === 3000) {
      // auto increment if default port in use
      server.on("error", (e: any) => {
        if (e.code === "EADDRINUSE") {
          port = port + 1
          console.log("Port in use, trying:", port)
          setTimeout(() => {
            server.close()
            server.listen(port)
          }, 1000)
        }
      })
    }
    server.listen(port)
  }
}

async function getExamplePath(name: string) {
  const p = path.resolve(examplesPath, name)

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
    const npm = spawn("npm", ["install"], { cwd: p, env: process.env })
    npm.stdout.on("data", data => {
      console.log(`${data}`)
    })

    npm.stderr.on("data", data => {
      console.error(`${data}`)
    })

    npm.on("close", code => {
      console.log(`npm install exited with code ${code}`)
      resolve(p)
    })
  })
}
