import { root, CommonOptions, getEnv } from "./root"
import { Command } from "commandpost/lib"
import * as path from "path"
import * as fs from "fs"
import { spawn } from "child_process"
import { FileAppStore } from "../file_app_store"
import { Server, ServerTlsOptions } from "../server"
import { RedisCacheNotifier } from "../redis_cache_notifier"
import { examplesPath } from "@fly/examples"
import { timingSafeEqual } from "crypto";

interface ServerOptions extends CommonOptions {
  port?: string
  useTls?: boolean
  tlsKeyPath?: string
  tlsCertPath?: string
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
  .option("--use-tls", "Use tls for dev server")
  .option("--tls-key-path <path>", "Path to tls key")
  .option("--tls-cert-path <path>", "Path to tls cert")
  .option("--inspect", "use the v8 inspector on your fly app")
  .option("--uglify", "uglify your code like we'll use in production (warning: slow!)")
  .action(async function(this: Command<ServerOptions, ServerArguments>, opts, args, rest) {
    // const { FileAppStore } = require('../file_app_store')
    // const { Server } = require('../server')

    let cwd = args.path || process.cwd()
    if (!fs.existsSync(cwd)) {
      cwd = (await getExamplePath(cwd)) || cwd
    }
    console.log(`Using ${cwd} as working directory.`)
    process.chdir(cwd)

    let port = parseInt((opts.port && opts.port[0]) || (process.env.PORT && process.env.PORT) || "3000", 10)
    const env = getEnv(this, "development")

    const appStore = new FileAppStore(cwd, { build: true, uglify: opts.uglify, env })

    const httpsConfig: ServerTlsOptions = {
      enabled: opts.useTls ? opts.useTls : false,
      config: {},
    }

    const tlsKeyPath: string | undefined = (opts.tlsKeyPath && opts.tlsKeyPath.length) !== 0 ? opts.tlsKeyPath : undefined;
    const tlsCertPath: string | undefined = (opts.tlsCertPath && opts.tlsCertPath.length) !== 0 ? opts.tlsCertPath : undefined;

    if (tlsKeyPath) {
      httpsConfig.config.key = fs.readFileSync(path.resolve(cwd, tlsKeyPath))
    }

    if (tlsCertPath) {
      httpsConfig.config.key = fs.readFileSync(path.resolve(cwd, tlsCertPath))
    }

    const server = new Server({ appStore, inspect: !!opts.inspect, https: httpsConfig })
    console.log("Cache Adapter: " + server.bridge.cacheStore.constructor.name)
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
  })

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
