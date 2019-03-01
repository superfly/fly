import { Server, FileAppStore, LocalFileStore, Runtime, Bridge, SQLiteDataStore } from "@fly/core"
import { parse, format } from "url"
import { ChildProcess } from "child_process"
import * as path from "path"
import * as fs from "fs"
import execa = require("execa")
import * as waitOn from "wait-on"
import * as os from "os"

export interface Options {
  servers: { [hostname: string]: string }
  hostname?: string
}

interface ServerOptions {
  host: string
  path: string
}

export class EdgeContext {
  private readonly servers: TestServer[]
  public readonly hostname: string

  constructor(options: Options) {
    this.servers = new Array<TestServer>()
    this.hostname = options.hostname || "127.0.0.1"

    for (const [hostname, appPath] of Object.entries(options.servers)) {
      const server = new TestServer(this, { host: hostname, path: appPath })
      this.servers.push(server)
    }

    if (this.servers.length === 0) {
      throw new Error("No servers specified")
    }
  }

  public start(): Promise<any> {
    return Promise.all(this.servers.map(s => s.start())).then(() => {
      this.registerAliases()
    })
  }

  public stop(): Promise<any> {
    return Promise.all(this.servers.map(s => s.stop()))
  }

  public get isRunning() {
    return this.servers.every(s => s.isRunning)
  }

  public getServer(host: string): TestServer | undefined {
    return this.servers.find(s => s.alias === host)
  }

  public rewriteUrl(url: string): string {
    const parsedUrl = parse(url)
    if (!parsedUrl.hostname) {
      return url
    }
    console.log("rewrite url from test", { url, hostname: parsedUrl.hostname })
    const server = this.servers.find(s => s.alias === parsedUrl.hostname)
    if (!server) {
      return url
    }
    parsedUrl.host = this.hostname + ":" + server.port
    parsedUrl.hostname = this.hostname
    parsedUrl.port = server.port.toString()
    console.log("-> new url", format(parsedUrl))
    return format(parsedUrl)
  }

  private registerAliases() {
    for (const server of this.servers) {
      for (const other of this.servers) {
        other.child!.send({ type: "alias-hostname", alias: server.alias, hostname: server.hostname })
      }
    }
  }
}

export class TestServer {
  private server?: Server
  private context: EdgeContext
  public readonly alias: string
  public readonly path: string
  public port: number

  public child?: ChildProcess
  private workingDir?: string

  public constructor(context: EdgeContext, options: ServerOptions) {
    this.context = context
    this.alias = options.host
    this.path = options.path
    this.port = nextPort()
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.workingDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-app"))

      if (fs.statSync(this.path).isDirectory()) {
        for (const file of fs.readdirSync(this.path)) {
          const src = path.join(this.path, file)
          const dst = path.join(this.workingDir, file)
          console.log(`Copy file ${src} => ${dst}`)
          fs.copyFileSync(src, dst)
        }
      } else {
        const dst = path.join(this.workingDir, `index${path.extname(this.path)}`)
        console.log(`Copy file ${this.path} => ${dst}`)
        fs.copyFileSync(this.path, dst)
      }

      this.child = execa("../../fly", ["server", "-p", this.port.toString(), this.workingDir], {
        stdio: ["ipc"],
        env: {
          LOG_LEVEL: "debug"
        }
      })
      this.child.on("close", (code, signal) => {
        console.log(`child process CLOSE due to receipt of signal ${signal}`, { code })
      })
      this.child.on("exit", (code, signal) => {
        console.log(`child process EXIT due to receipt of signal ${signal}`, { code })
      })
      this.child.on("error", err => {
        console.log(`child process error`, { err })
      })
      this.child.stdout.on("data", chunk => {
        process.stdout.write(`[${this.alias}] ${chunk}`)
        // console.log(`[${this.alias}] ${chunk}`, { chunk })
      })

      // this.child.stdout.pipe(process.stdout)
      // this.child.stderr.pipe(process.stderr)

      waitOn({ resources: [`tcp:${this.context.hostname}:${this.port}`], timeout: 10000 }).then(resolve, reject)

      console.log(`${this.alias} running at ${this.hostname}`)
    })
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.child) {
        // console.log("stopping child")
        try {
          // console.log("A")
          this.child.kill()
          // this.child.kill("SIGINT")
          // console.log("B")
          resolve()
        } catch (error) {
          console.error("err", error)
          reject(error)
        }
      } else {
        // console.log("no child")
        resolve()
      }
    })
  }

  public get hostname() {
    return `${this.context.hostname}:${this.port}`
  }

  // this is a hack for accessing the cache directly, not sure we should do this
  // for long, especially if runtime moves to rust
  public get cacheStore() {
    if (!this.server) {
      throw new Error("Start server before accessing cacheStore")
    }

    const cacheStore = this.server.bridge.cacheStore
    const runtime = this.server.runtime
    const ns = runtime.app.id.toString()

    return {
      get: (key: string): Promise<Buffer | null> => {
        return cacheStore.get(ns, key)
      },
      set: (key: string, value: any): Promise<boolean> => {
        return cacheStore.set(ns, key, value)
      },
      ttl: (key: string): Promise<number> => {
        return cacheStore.ttl(ns, key)
      }
    }
  }

  public get isRunning(): boolean {
    return this.child !== undefined
  }
}

export function isContext(value: any): value is EdgeContext {
  return value instanceof EdgeContext
}

function nextPort() {
  return Math.floor(Math.random() * 1000 + 4000)
}

function configureBridge(bridge: Bridge, context: EdgeContext) {
  const oldFetch = bridge.get("fetch")
  if (!oldFetch) {
    throw new Error("Fetch not registered")
  }
  const newFetch = (rt: Runtime, newBridge: Bridge, url: string, ...args: any[]) => {
    const mappedUrl = context.rewriteUrl(url)
    return oldFetch.apply(newBridge, [rt, newBridge, ...[mappedUrl].concat(args)])
  }
  bridge.set("fetch", newFetch)
}
