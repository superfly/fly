import { App } from "./app"
import * as path from "path"
import * as fs from "fs-extra"

import { buildApp } from "./utils/build"
import { getEnv, getLocalRelease, LocalRelease } from "./utils/local"

export interface FileAppStoreOptions {
  build?: boolean
  noWatch?: boolean
  noSource?: boolean
  config?: any
  secrets?: any
  uglify?: boolean
  env?: string
  noReleaseReuse?: boolean
}

export class FileAppStore {
  public cwd: string

  public release: LocalRelease

  public options: FileAppStoreOptions
  public readonly app: App

  constructor(cwd: string, options: FileAppStoreOptions = {}) {
    this.cwd = cwd
    this.options = options

    if (!fs.existsSync(cwd)) {
      throw new Error("Could not find path: " + cwd)
    }

    const stat = fs.statSync(cwd)
    if (!stat.isDirectory()) {
      this.cwd = path.dirname(cwd)
    }

    const env = options.env || getEnv()

    if (options.noReleaseReuse) {
      this.release = new LocalRelease(cwd, env, { noWatch: options.noWatch })
    } else {
      this.release = getLocalRelease(cwd, env, { noWatch: options.noWatch })
    }

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

    if (!options.build) {
      let fullPath = cwd
      if (stat.isDirectory()) {
        fullPath = path.resolve(cwd, "./index.js")
      }
      if (!fs.existsSync(fullPath)) {
        throw new Error("no code to use")
      }
      this.release.source = fs.readFileSync(fullPath).toString()
      return
    }

    buildApp(
      cwd,
      { watch: this.options.noWatch || true, uglify: this.options.uglify },
      (err: Error, code: string, hash: string, sourceMap: string) => {
        if (err) {
          return console.error(err)
        }

        this.release.source = code
        this.release.sourceHash = hash
        this.release.sourceMap = sourceMap
      }
    )
  }
}
