import Command, { flags as cmdFlags } from "@oclif/command"
import * as path from "path"
import * as fs from "fs"
import { spawn } from "child_process"
import { Server, LocalFileStore, FileSystemBlobStore } from "@fly/core"
import { DevAppStore, SQLiteDataStore } from "../dev"
import { examplesPath } from "@fly/examples"
import { FlyCommand } from "../base-command"
import * as sharedFlags from "../flags"

export default class ServerCmd extends FlyCommand {
  public static description = "run the local fly development server"

  public static flags = {
    env: sharedFlags.env("development"),
    port: cmdFlags.integer({
      char: "p",
      description: "Port to bind to",
      env: "PORT",
      default: 3000
    }),
    inspect: cmdFlags.boolean({
      description: "use the v8 inspector on your fly app",
      default: false
    }),
    uglify: cmdFlags.boolean({
      description: "uglify your code like we'll use in production (warning: slow!)",
      default: false
    }),
    watch: cmdFlags.boolean({
      description: "reload when source or configs change",
      default: true,
      allowNo: true
    })
  }

  static args = [{ name: "path", description: "path to app", default: process.cwd() }]

  public async run() {
    const { args, flags } = this.parse(ServerCmd)
    let appDir = args.path || process.cwd()
    appDir = path.resolve(appDir)

    if (!fs.existsSync(appDir)) {
      appDir = (await getExamplePath(appDir)) || appDir
    }
    console.log(`Using ${appDir} as working directory.`)

    let port = flags.port!
    const env = flags.env!

    const appStore = new DevAppStore({
      appDir,
      env
    })

    if (flags.watch) {
      appStore.watch({ uglify: flags.uglify })
    } else {
      appStore.build({ uglify: flags.uglify })
    }

    const server = new Server({
      appStore,
      env,
      inspect: !!flags.inspect,
      bridgeOptions: {
        fileStore: new LocalFileStore(appDir),
        blobStore: new FileSystemBlobStore(),
        dataStore: new SQLiteDataStore(appStore.appName(), appStore.env)
      }
    })

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
