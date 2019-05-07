import { App, Release } from "./app"
import * as path from "path"
import * as fs from "fs-extra"
import * as YAML from "js-yaml"
import * as glob from "glob"
import * as chokidar from "chokidar"
import { buildApp, buildAndWatchApp, BuildInfo, BuildOptions } from "@fly/build"
import { formatByteLength } from "./utils/formatting"

export interface FileAppStoreOptions {
  appDir: string
  env: string
  app_name?: string
  buildDir?: string
}

export class FileAppStore {
  public readonly app: App
  public readonly appDir: string
  public release: Release
  public readonly buildDir: string
  public readonly env: string

  constructor(options: FileAppStoreOptions) {
    this.appDir = options.appDir || process.cwd()
    if (!fs.existsSync(this.appDir)) {
      throw new Error("Could not find path: " + this.appDir)
    }
    const stat = fs.statSync(this.appDir)
    if (!stat.isDirectory()) {
      this.appDir = path.dirname(this.appDir)
    }

    this.env = options.env

    this.buildDir = options.buildDir || path.join(this.appDir, ".fly", "build", this.env)
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirpSync(this.buildDir)
    }

    this.release = {
      app: options.app_name || this.appDir,
      env: this.env,
      version: 0,
      source: "",
      sourceHash: "",
      config: {},
      secrets: {}
    }

    this.app = new App(this.release)

    // some callers expect config to be loaded after constructor returns
    this.buildConfig()
    this.loadSecrets()
  }

  public async build(options: Partial<BuildOptions> = {}) {
    const buildOptions = { ...options, inputPath: this.appDir, outputPath: this.buildDir }
    const info = await buildApp(buildOptions)
    this.onBuildSuccess(info)
    return info
  }

  public watch(options: Partial<BuildOptions> = {}) {
    const buildOptions = { ...options, inputPath: this.appDir, outputPath: this.buildDir }
    this.watchConfigFiles()
    buildAndWatchApp(buildOptions, this.onBuildSuccess.bind(this), this.onBuildError.bind(this))
  }

  private buildConfig() {
    const config = buildConfig(this.appDir, this.buildDir, this.env)
    // console.debug("Loading Config", { config })
    this.release.app = config.app
    this.release.config = config.config
    this.release.files = config.files
  }

  private loadSecrets() {
    this.release.secrets = getSecrets(this.appDir)
  }

  private onBuildSuccess(info: BuildInfo) {
    this.release.source = info.source.text
    this.release.sourceHash = info.source.digest
    this.release.sourceMap = info.sourceMap.text

    const sourceSize = info.source.byteLength
    const sourceMapSize = info.sourceMap.byteLength

    console.info(
      `Compiled app in ${info.time}ms (source: ${formatByteLength(sourceSize)} sourceMap: ${formatByteLength(
        sourceMapSize
      )} hash: ${info.source.digest})`
    )
  }

  private onBuildError(err: Error) {
    console.error(err)
  }

  private watchConfigFiles() {
    const watcher = chokidar.watch([configFile, secretsFile, webpackFile], {
      cwd: this.appDir,
      ignoreInitial: true
    })
    watcher.on("add", this.onConfigFileUpdate.bind(this, "add"))
    watcher.on("change", this.onConfigFileUpdate.bind(this, "change"))
  }

  public onConfigFileUpdate(event: string, appPath: string) {
    console.log(`Config watch (${event}: ${appPath})`)
    if (appPath.endsWith(configFile)) {
      this.buildConfig()
    } else if (appPath.endsWith(secretsFile)) {
      this.loadSecrets()
    }
  }

  public manifest() {
    return [
      {
        rootDir: this.buildDir,
        files: glob.sync(path.join(this.buildDir, "**"), { cwd: this.appDir })
      },
      {
        rootDir: this.appDir,
        files: this.release.files || []
      }
    ]
  }
}

const secretsFile = ".fly.secrets.yml"
const configFile = ".fly.yml"
const configFileOutput = "fly.yml"
const webpackFile = "webpack.fly.config.js"

function buildConfig(sourceDir: string, buildDir: string, env: string) {
  const sourceFile = path.join(sourceDir, configFile)
  const outFile = path.join(buildDir, configFileOutput)

  let config: any = {}

  if (fs.existsSync(sourceFile)) {
    const inputConfig = YAML.load(fs.readFileSync(sourceFile).toString()) || {}
    config = inputConfig[env] || inputConfig || {}
  }

  config.app = config.app_id || config.app || sourceDir
  config.files = expandFiles(sourceDir, config.files || [])
  config.config = config.config || {}

  fs.writeFileSync(outFile, YAML.dump(config))

  return config
}

function expandFiles(cwd: string, patterns: string[]): string[] {
  if (patterns.length === 0) {
    return []
  }

  const files: string[] = []

  for (let p of patterns) {
    if (fs.existsSync(p)) {
      const stat = fs.statSync(path.join(cwd, p))
      if (stat.isDirectory()) {
        // glob full directories by default
        p = path.join(p, "**")
      }
    }
    for (const f of glob.sync(p, { cwd })) {
      files.push(f)
    }
  }
  return files
}

function getSecrets(cwd: string) {
  const localSecretsPath = path.join(cwd, secretsFile)
  let secrets = {}

  if (fs.existsSync(localSecretsPath)) {
    secrets = YAML.load(fs.readFileSync(localSecretsPath).toString())
  }

  return secrets
}
