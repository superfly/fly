import * as path from "path"
import * as YAML from "js-yaml"
import * as fs from "fs-extra"
import * as glob from "glob"
import { EventEmitter } from "events"
import * as chokidar from "chokidar"

import log from "../log"
import { Release } from "../app"

const secretsFile = ".fly.secrets.yml"
const configFile = ".fly.yml"
const webpackFile = "webpack.fly.config.js"

const releases: { [key: string]: LocalRelease } = {}

export interface LocalReleaseOptions {
  noWatch?: boolean
}

export function getLocalRelease(
  cwd: string = process.cwd(),
  env: string = getEnv(),
  options: LocalReleaseOptions = {}
) {
  const key = `${cwd}:${env}:${JSON.stringify(options)}`
  if (releases[key]) {
    return releases[key]
  }
  const release = new LocalRelease(cwd, env, options)
  releases[key] = release
  return release
}

export interface FlyConfig {
  app?: string
  app_id?: string // legacy
  config?: any
  files?: string[]
  expandedFiles?: string[]
}

export class LocalRelease extends EventEmitter implements Release {
  public cwd: string
  public env: string

  public app: string
  public version: number
  public source: string
  public sourceHash: string
  public sourceMap?: string
  public hash?: string
  public config: any
  public secrets: any
  public files: string[]

  constructor(cwd: string = process.cwd(), env: string = getEnv(), options: LocalReleaseOptions = {}) {
    super()
    this.cwd = cwd
    this.env = env || getEnv()

    const conf = this.getConfig()
    this.config = conf.config || {}
    this.secrets = this.getSecrets()

    this.app = conf.app || conf.app_id || cwd
    this.version = 0
    this.source = ""
    this.hash = ""
    this.sourceHash = ""
    this.files = conf.files || []

    if (!options.noWatch) {
      this.watchConfig()
    }
  }

  public getConfig(): FlyConfig {
    const localConfigPath = path.join(this.cwd, configFile)
    const builtConfigPath = path.join(this.cwd, ".fly", configFile)
    let config: any = {}
    if (fs.existsSync(localConfigPath)) {
      config = YAML.load(fs.readFileSync(localConfigPath).toString()) || {}
      if (this.expandFiles(config)) {
        // write generated config if it was dirty
        fs.mkdirpSync(path.join(this.cwd, ".fly"))
        fs.writeFileSync(builtConfigPath, YAML.dump(config))
      } else if (fs.existsSync(builtConfigPath)) {
        // nuke any lingering one
        fs.unlinkSync(builtConfigPath)
      }
    }

    config = config[this.env] || config || {}
    config.app = config.app_id || config.app

    return config
  }

  public expandFiles(config: FlyConfig) {
    if (!config.files) {
      return
    }
    let dirty = false
    const files = config.files
    config.files = []

    for (let p of files) {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(path.join(this.cwd, p))
        if (stat.isDirectory()) {
          // glob full directories by default
          p = path.join(p, "**")
        }
      }
      for (const f of glob.sync(p, { cwd: this.cwd })) {
        if (f !== p) {
          dirty = true
        } // at least one glob
        config.files.push(f)
      }
    }
    return dirty
  }

  public getSecrets() {
    const localSecretsPath = path.join(this.cwd, secretsFile)
    let secrets = {}

    if (fs.existsSync(localSecretsPath)) {
      secrets = YAML.load(fs.readFileSync(localSecretsPath).toString())
    }

    return secrets
  }

  public watchConfig() {
    const watcher = chokidar.watch([configFile, secretsFile, webpackFile], {
      cwd: this.cwd
    })
    watcher.on("add", this.update.bind(this, "add"))
    watcher.on("change", this.update.bind(this, "change"))
  }

  public update(event: string, appPath: string) {
    log.info(`Config watch (${event}: ${appPath})`)
    if (appPath.endsWith(configFile)) {
      const conf = this.getConfig()
      this.config = conf.config
      this.files = conf.files || []
      this.app = conf.app || conf.app_id || ""
    } else if (appPath.endsWith(secretsFile)) {
      this.secrets = this.getSecrets()
    }
    this.emit("update", this)
  }
}

export function getEnv() {
  return process.env.FLY_ENV || process.env.NODE_ENV || "development"
}
