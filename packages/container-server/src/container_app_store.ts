import { App, Release } from "@fly/core"
import * as path from "path"
import * as fs from "fs"
import * as YAML from "js-yaml"
import { findSecretsInConfig } from "@fly/core/lib/utils/app"

export interface ContainerAppStoreOptions {
  dir: string
  env: string
}

export class ContainerAppStore {
  public readonly app: App
  public readonly dir: string
  public release: Release
  public readonly env: string

  constructor(options: ContainerAppStoreOptions) {
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
      secrets: findSecrets(rawConfig.config)
    }

    this.app = new App(this.release)
  }
}

function findSecrets(config: any) {
  const secrets: { [key: string]: string } = {}

  for (const secretName of findSecretsInConfig(config)) {
    const secretVal = process.env[secretName.toUpperCase()]
    if (secretVal != null) {
      secrets[secretName] = secretVal
    }
  }

  return secrets
}
