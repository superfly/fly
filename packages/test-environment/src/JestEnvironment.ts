const NodeEnvironment = require("jest-environment-node")
import { EdgeContext } from "./EdgeContext"
import { install } from "./helpers"

class JestEnvironment extends NodeEnvironment {
  private readonly appIndex: Map<string, string[]>
  private testContext: EdgeContext | undefined

  constructor(config: any) {
    super(config)

    this.appIndex = new Map()
  }

  public setup() {
    this.global.env = this

    install(this, this.global)

    return Promise.resolve()
  }

  public createContext() {
    const servers: { [hostname: string]: string } = {}
    for (const [hostname, paths] of this.appIndex) {
      if (paths.length > 0) {
        servers[hostname] = paths[0]
      }
    }

    return new EdgeContext({ servers })
  }

  public async startContext() {
    if (this.testContext) {
      throw new Error("test context already exists")
    }
    this.testContext = this.createContext()
    await this.testContext.start()
  }

  public async stopContext() {
    if (this.testContext) {
      await this.testContext.stop()
      this.testContext = undefined
    }
  }

  public get currentContext(): EdgeContext {
    if (!this.testContext) {
      throw new Error("no test context")
    }
    return this.testContext
  }

  public pushApps(apps: { [host: string]: string }) {
    Object.entries(apps).forEach(([host, path]) => {
      let hostApps = this.appIndex.get(host)
      if (!hostApps) {
        hostApps = []
        this.appIndex.set(host, hostApps)
      }
      hostApps.unshift(path)
    })
  }

  public popApps(apps: { [host: string]: string }) {
    Object.entries(apps).forEach(([host, path]) => {
      const hostApps = this.appIndex.get(host)
      if (!hostApps || hostApps[0] !== path) {
        console.warn(
          "Attempting to pop an app that isn't configured!",
          { host: path },
          this.appIndex
        )
        return
      }
      hostApps.shift()
    })
  }

  public teardown() {
    return Promise.resolve()
  }
}

export default JestEnvironment
