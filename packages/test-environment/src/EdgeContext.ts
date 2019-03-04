import { Server } from "@fly/core"
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
    console.debug("rewrite url from test", { url, hostname: parsedUrl.hostname })
    const server = this.servers.find(s => s.alias === parsedUrl.hostname)
    if (!server) {
      return url
    }
    parsedUrl.host = this.hostname + ":" + server.port
    parsedUrl.hostname = this.hostname
    parsedUrl.port = server.port.toString()
    console.debug("-> new url", format(parsedUrl))
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
          console.debug(`Copy file ${src} => ${dst}`)
          fs.copyFileSync(src, dst)
        }
      } else {
        const dst = path.join(this.workingDir, `index${path.extname(this.path)}`)
        console.debug(`Copy file ${this.path} => ${dst}`)
        fs.copyFileSync(this.path, dst)
      }

      this.child = execa("../../fly", ["server", "-p", this.port.toString(), this.workingDir], {
        stdio: ["ipc"],
        env: {
          LOG_LEVEL: process.env.LOG_LEVEL,
          FLY_ENV: "test"
        }
      })
      this.child.on("exit", (code, signal) => {
        console.debug(`[${this.alias}] exit from signal ${signal}`, { code })
      })
      this.child.on("error", err => {
        console.warn(`[${this.alias}] process error`, { err })
      })
      this.child.stdout.on("data", chunk => {
        console.debug(`[${this.alias}] ${chunk}`)
      })

      // this.child.stdout.pipe(process.stdout)
      // this.child.stderr.pipe(process.stderr)

      waitOn({ resources: [`tcp:${this.context.hostname}:${this.port}`], timeout: 10000 }).then(resolve, reject)

      console.debug(`${this.alias} running at ${this.hostname}`)
    })
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.child) {
        try {
          this.child.kill()
          resolve()
        } catch (error) {
          console.error("err", error)
          reject(error)
        }
      } else {
        resolve()
      }
    })
  }

  public get hostname() {
    return `${this.context.hostname}:${this.port}`
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
