import { applySecrets } from "./utils/app"
import { ivm } from "./"

export interface Release {
  app: string
  version: number
  source: string
  source_hash: string
  source_map?: string
  config: any
  hash?: string
  secrets: any
  env: string
  files?: string[]
}

export class App {
  /** a unique app identifier, used for scoping cache/etc */
  public id: any
  private _config: any

  constructor(public release: Release) {
    this.id = this.release.app
  }

  get name() {
    return this.release.app
  }

  get env() {
    return this.release.env
  }

  get files() {
    return this.release.files
  }

  get config() {
    if (this._config) {
      return this._config
    }
    this._config = this.release.config
    applySecrets(this._config, this.release.secrets)
    return this._config
  }

  get source() {
    return this.release.source
  }

  get version() {
    return this.release.version
  }

  get hash() {
    return this.release.hash
  }

  get sourceHash() {
    return this.release.source_hash
  }

  get sourceMap() {
    return this.release.source_map
  }

  public asJSON() {
    return {
      name: this.name,
      config: this.config,
      version: this.version,
      env: this.env
    }
  }

  public forV8() {
    return new ivm.ExternalCopy(this.asJSON()).copyInto({ release: true })
  }
}
