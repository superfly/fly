
import { Server, FileAppStore, Runtime, Bridge } from "@fly/core"
import { HostMap } from "./HostMap";

export interface EnvironmentOptions {
  testName: string
  testDir: string
  servers: ServerOptions[]
  hostname?: string
}

export interface ServerOptions {
  host: string
  path: string
  port?: number
}

export class Environment {
  public readonly testName: string
  public readonly testDir: string

  private readonly servers: TestServer[]
  private readonly hostname: string

  public readonly hostMap: HostMap

  constructor(options: EnvironmentOptions) {
    this.testName = options.testName
    this.testDir = options.testDir
    this.servers = new Array<TestServer>()
    this.hostname = options.hostname || "127.0.0.1"

    this.hostMap = new HostMap()

    for (const serverOptions of options.servers) {
      const server = new TestServer(serverOptions)
      this.servers.push(server)
      this.hostMap.add(server.host, {
        hostname: this.hostname,
        port: server.port.toString()
      })
    }

    if (this.servers.length == 0) {
      throw new Error("No servers specified")
    }
  }

  public start(): Promise<any> {
    return Promise.all(this.servers.map(s => s.start(this.hostMap.copy())))
  }

  public stop(): Promise<any> {
    return Promise.all(this.servers.map(s => s.stop()))
  }

  public get isRunning() {
    return this.servers.every(s => s.isRunning)
  }
}

class TestServer {
  private server?: Server
  public readonly host: string
  public readonly path: string
  public readonly port: number

  public constructor(options: ServerOptions) {
    this.host = options.host
    this.path = options.path
    this.port = options.port || randomPort()
  }

  public start(hostMap: HostMap): Promise<void> {
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
        this.server.on('error', (e: Error) => { throw e })
        configureBridge(this.server.bridge, hostMap)

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
      if (this.server && this.isRunning) {
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

function configureBridge(bridge: Bridge, hostMap: HostMap) {
  const oldFetch = bridge.get("fetch")
  if (!oldFetch) {
    throw new Error("Fetch not registered")
  }
  const newFetch = function fetchBridge(rt: Runtime, bridge: Bridge, url: string, ...args: any[]) {
    const mappedUrl = hostMap.transformUrl(url)
    return oldFetch.apply(bridge, [rt, bridge, ...[mappedUrl].concat(args)])
  }
  bridge.set("fetch", newFetch)
}