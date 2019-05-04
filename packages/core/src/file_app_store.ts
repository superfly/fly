import { App } from "./app"
import * as path from "path"
import * as fs from "fs-extra"

import { buildApp, buildAndWatchApp, BuildInfo, BuildOptions } from "./utils/build"
import { getEnv, LocalRelease } from "./utils/local"

export interface FileAppStoreOptions {
  path?: string
  build?: boolean
  watch?: boolean
  noSource?: boolean
  config?: any
  secrets?: any
  uglify?: boolean
  env?: string
  // noReleaseReuse?: boolean
  buildOptions?: {
    entry?: string | string[]
  }
}

// export enum BuildMode {
//   None,
//   Build,
//   Watch
// }

export class FileAppStore {
  public readonly app: App
  public readonly cwd: string
  public release: LocalRelease
  public options: FileAppStoreOptions

  constructor(options: FileAppStoreOptions = {}) {
    this.options = options

    this.cwd = options.path || process.cwd()

    if (!fs.existsSync(this.cwd)) {
      throw new Error("Could not find path: " + this.cwd)
    }

    const stat = fs.statSync(this.cwd)
    if (!stat.isDirectory()) {
      this.cwd = path.dirname(this.cwd)
    }

    const env = options.env || getEnv()

    this.release = new LocalRelease(this.cwd, env, { noWatch: options.watch === false })

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

    if (this.options.watch === true) {
      this.watch()
    } else if (this.options.build !== false) {
      this.build()
    }
  }

  public async build() {
    const buildOptions = { ...this.options.buildOptions, inputPath: this.cwd }

    const info = await buildApp(buildOptions)
    this.onBuildSuccess(info)
    return info
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
}
