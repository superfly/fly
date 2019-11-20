import { App, Release } from "@fly/core"
import * as path from "path"
import * as fs from "fs-extra"
import * as YAML from "js-yaml"

export interface BundleAppStoreOptions {
  dir: string
  env: string
}

export class BundleAppStore {
  public readonly app: App
  public readonly dir: string
  public release: Release
  public readonly env: string

  constructor(options: BundleAppStoreOptions) {
    this.dir = options.dir
    if (!fs.existsSync(this.dir)) {
      throw new Error("Could not find path: " + this.dir)
    }
    const stat = fs.statSync(this.dir)
    if (!stat.isDirectory()) {
      this.dir = path.dirname(this.dir)
    }

    this.env = options.env

    const configFilePath = path.join(this.dir, "fly.yml")

    if (!fs.existsSync(configFilePath)) {
      throw new Error("Could not find config file: " + configFilePath)
    }
    const rawConfig = YAML.load(fs.readFileSync(configFilePath).toString())

    const source = fs.readFileSync(path.join(this.dir, "fly-bundle.js")).toString()
    const sourceMap = fs.readFileSync(path.join(this.dir, "fly-bundle.map.json")).toString()

    this.release = {
      app: process.env.FLY_APP_NAME || rawConfig.app,
      env: this.env,
      version: 0,
      source,
      sourceMap,
      sourceHash: "",
      config: rawConfig.config,
      files: rawConfig.files,
      secrets: {}
    }

    this.app = new App(this.release)
  }
}
