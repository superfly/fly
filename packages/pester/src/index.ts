
import { Server, FileAppStore } from "@fly/core"
import axios, { AxiosResponse } from 'axios'
import { URL } from 'url'
import fetch, { Request, Response, RequestInit } from "node-fetch"

export interface EnvironmentOptions {
  testName: string
  testDir: string
  servers: ServerOptions[]
  hostname?: string
}

export interface RequestInit {
  method?: string
}

export class Environment {
  public readonly testName: string
  public readonly testDir: string

  private readonly servers: TestServer[]
  private readonly hostname: string

  constructor(options: EnvironmentOptions) {
    this.testName = options.testName
    this.testDir = options.testDir
    this.servers = new Array<TestServer>()
    this.hostname = options.hostname || "127.0.0.1"

    for (const serverOptions of options.servers) {
      this.servers.push(new TestServer(serverOptions))
    }

    if (this.servers.length == 0) {
      throw new Error("No servers specified")
    }
  }

  public fetch(url: string, init?: RequestInit): Promise<Response> {
    const transformedUrl = this.transformRequestUrl(url)
    console.debug("[fetch]", transformedUrl)
    return fetch(transformedUrl, init)
  }

  public start(): Promise<any> {
    return Promise.all(this.servers.map(s => s.start()))
  }

  public stop(): Promise<any> {
    return Promise.all(this.servers.map(s => s.stop()))
  }

  public get isRunning() {
    return this.servers.every(s => s.isRunning)
  }

  private transformRequestUrl(inputUrl: string) {
    const url = new URL(inputUrl)
    if (url.protocol !== "http:") {
      throw new Error("Protocol must be http")
    }
    for (const server of this.servers) {
      if (url.host === server.name) {
        url.hostname = this.hostname
        url.port = server.port.toString()
        return url.toString()
      }
    }
    throw new Error(`no test server found for host '${url.host}'`)
  }
}

export interface ServerOptions {
  name: string
  path: string
  port?: number
  host?: string
}

class TestServer {
  private server?: Server
  public readonly name: string
  public readonly path: string
  public readonly port: number
  public readonly host: string

  public constructor(options: ServerOptions) {
    this.name = options.name
    this.path = options.path
    this.port = options.port || randomPort()
    this.host = options.host || `${options.name.toLowerCase()}.test`
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const appStore = new FileAppStore(this.path, {
          build: false,
          uglify: false,
          env: "test",
          noReleaseReuse: true,
          noWatch: true
        })
        this.server = new Server({ appStore, inspect: false, monitorFrequency: 0 })
        this.server.listen({ port: this.port }, () => {
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        try {
          this.server.close(() => {
            resolve()
          })
        } catch (error) {
          reject(error)
        }
      } else {
        resolve()
      }
    })
  }

  public get isRunning(): boolean {
    return this.server && this.server.listening || false
  }
}

function randomPort() {
  return Math.floor((Math.random() * 1000) + 4000)
}
