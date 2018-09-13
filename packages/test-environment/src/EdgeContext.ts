
import { Server, FileAppStore, LocalFileStore, Runtime, Bridge, SQLiteDataStore } from "@fly/core"
import { parse, format } from "url";

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
  private readonly hostname: string

  constructor(options: Options) {
    this.servers = new Array<TestServer>()
    this.hostname = options.hostname || "127.0.0.1"

    for (const [hostname, path] of Object.entries(options.servers)) {
      const server = new TestServer(this, { host: hostname, path: path })
      this.servers.push(server)
    }

    if (this.servers.length == 0) {
      throw new Error("No servers specified")
    }
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

  public getServer(host: string): TestServer | undefined {
    return this.servers.find(s => s.host === host)
  }

  public rewriteUrl(url: string): string {
    const parsedUrl = parse(url)
    if (!parsedUrl.hostname) {
      return url
    }
    const server = this.servers.find(s => s.host === parsedUrl.hostname)
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
  public readonly host: string
  public readonly path: string
  public port: number


  public constructor(context: EdgeContext, options: ServerOptions) {
    this.context = context
    this.host = options.host
    this.path = options.path
    this.port = nextPort()
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
        const bridge = new Bridge({
          fileStore: new LocalFileStore(this.path, appStore.release),
          dataStore: new SQLiteDataStore(appStore.app.name, "test")
        })
        this.server = new Server({ appStore, bridge, inspect: false, monitorFrequency: 0 })
        this.server.on('error', (e: Error | any) => {
          if (e.code === 'EADDRINUSE') {
            this.port = this.port + 1
            console.log('Port in use, trying:', this.port);
            setTimeout(() => {
              if (this.server) {
                this.server.close();
                this.server.listen(this.port);
              }
            }, 1000);
          } else {
            throw e
          }
        })
        configureBridge(this.server.bridge, this.context)

        this.server.listen({ port: this.port }, () => {
          resolve()
        })
      } catch (error) {
        console.error("Error starting server", error)
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
    return this.server && this.server.listening || false
  }
}

export function isContext(value: any): value is EdgeContext {
  return value instanceof EdgeContext
}

function nextPort() {
  return Math.floor((Math.random() * 1000) + 4000)
}

function configureBridge(bridge: Bridge, context: EdgeContext) {
  const oldFetch = bridge.get("fetch")
  if (!oldFetch) {
    throw new Error("Fetch not registered")
  }
  const newFetch = function fetchBridge(rt: Runtime, bridge: Bridge, url: string, ...args: any[]) {
    const mappedUrl = context.rewriteUrl(url)
    return oldFetch.apply(bridge, [rt, bridge, ...[mappedUrl].concat(args)])
  }
  bridge.set("fetch", newFetch)
}