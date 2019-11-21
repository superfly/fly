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
  }

  public start(): Promise<any> {
    if (!this.servers) {
      return Promise.resolve()
    }

    const aliasMap = this.servers.map(s => [s.alias, s.hostname]) as Array<[string, string]>

    return Promise.all(this.servers.map(s => s.start(aliasMap)))
  }

  public stop(): Promise<any> {
    if (!this.servers) {
      return Promise.resolve()
    }

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
    const server = this.servers.find(s => s.alias === parsedUrl.hostname)
    if (!server) {
      return url
    }
    parsedUrl.host = this.hostname + ":" + server.port
    parsedUrl.hostname = this.hostname
    parsedUrl.port = server.port.toString()
    return format(parsedUrl)
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

  public start(aliasMap: Array<[string, string]>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.workingDir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-app"))

      try {
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
      } catch (err) {
        console.warn(err)
        reject(new Error("Error copying test app: " + err.toString()))
      }

      this.child = execa("../../fly", ["server", "-p", this.port.toString(), "--no-watch", this.workingDir], {
        env: {
          LOG_LEVEL: process.env.LOG_LEVEL,
          FLY_ENV: "test",
          HOST_ALIASES: JSON.stringify(aliasMap)
        }
      })
      // this.child.on("exit", (code, signal) => {
      //   console.debug(`[${this.alias}] exit from signal ${signal}`, { code })
      // })
      this.child.on("error", err => {
        console.warn(`[${this.alias}] process error`, { err })
      })
      this.child.stdout?.on("data", chunk => {
        console.debug(`[${this.alias}] ${chunk}`)
      })

      waitOn({ resources: [`tcp:${this.context.hostname}:${this.port}`], timeout: 10000 }).then(resolve, reject)
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
