import { App, Release } from "./app"
import * as path from "path"
import * as fs from "fs-extra"
import * as YAML from "js-yaml"
import * as glob from "glob"

import { buildApp, buildAndWatchApp, BuildInfo, BuildOptions } from "@fly/build"
// import { getEnv, LocalRelease } from "./utils/local"

export interface FileAppStoreOptions {
  path: string
  env: string
  app_name?: string

  build?: boolean
  watch?: boolean
  noSource?: boolean
  config?: any
  secrets?: any
  uglify?: boolean
  // noReleaseReuse?: boolean
  buildOptions?: {
    entry?: string | string[]
  }
  outDir?: string
}

// export enum BuildMode {
//   None,
//   Build,
//   Watch
// }

export class FileAppStore {
  public readonly app: App
  public readonly cwd: string
  public release: Release
  public options: FileAppStoreOptions

  public readonly outDir: string
  public readonly env: string

  constructor(options: FileAppStoreOptions) {
    this.options = options

    this.cwd = options.path || process.cwd()
    if (!fs.existsSync(this.cwd)) {
      throw new Error("Could not find path: " + this.cwd)
    }

    this.env = this.options.env

    this.outDir = options.outDir || path.join(this.cwd, ".fly", "build", this.env)
    if (!fs.existsSync(this.outDir)) {
      fs.mkdirpSync(this.outDir)
    }

    const stat = fs.statSync(this.cwd)
    if (!stat.isDirectory()) {
      this.cwd = path.dirname(this.cwd)
    }

    // this.

    // const env = options.env || getEnv()

    this.release = {
      app: options.app_name || this.cwd,
      env: this.env,
      version: 0,
      source: "",
      sourceHash: "",
      config: {},
      secrets: {}
    }
    // new LocalRelease(this.cwd, env, { noWatch: options.watch === false })()

    this.app = new App(this.release)

    if (this.options.config) {
      this.release.config = this.options.config
    }

    if (this.options.secrets) {
      this.release.secrets = this.options.secrets
    }

    if (options.noSource) {
      return
    }

    // if (!options.build) {
    //   let fullPath = cwd
    //   if (stat.isDirectory()) {
    //     fullPath = path.resolve(cwd, "./index.js")
    //   }
    //   if (!fs.existsSync(fullPath)) {
    //     throw new Error("no code to use")
    //   }
    //   this.release.source = fs.readFileSync(fullPath).toString()
    //   return
    // }

    this.buildConfig()
    this.loadSecrets()

    if (this.options.watch === true) {
      this.watch()
    } else if (this.options.build !== false) {
      this.build()
    }
  }

  public async build() {
    const buildOptions = { ...this.options.buildOptions, inputPath: this.cwd, outputPath: this.outDir }

    const info = await buildApp(buildOptions)
    this.onBuildSuccess(info)
    return info
  }

  public buildConfig() {
    const config = buildConfig(this.cwd, this.outDir, this.env)
    console.log("BUILT CONFIG", { config })
    this.release.app = config.app
    this.release.config = config.config
    this.release.files = config.files
  }

  public loadSecrets() {
    this.release.secrets = getSecrets(this.cwd)
  }

  public watch() {
    const buildOptions = { ...this.options.buildOptions, inputPath: this.cwd }
    buildAndWatchApp(buildOptions, this.onBuildSuccess.bind(this), this.onBuildError.bind(this))
  }

  private onBuildSuccess(info: BuildInfo) {
    this.release.source = info.source.text
    this.release.sourceHash = info.source.digest
    this.release.sourceMap = info.sourceMap.text

    const sourceSize = info.source.byteLength / (1024 * 1024)
    const sourceMapSize = info.source.byteLength / (1024 * 1024)

    console.info(
      `Compiled app in ${info.time}ms size:${sourceSize} sourceMap:${sourceMapSize} hash: ${info.source.digest}`
    )
  }

  private onBuildError(err: Error) {
    console.error(err)
  }

  public manifest() {
    return [
      {
        rootDir: this.outDir,
        files: glob.sync(path.join(this.outDir, "**"), { cwd: this.cwd })
      },
      {
        rootDir: this.cwd,
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
