import { parseConfig } from './app/config'
import { ivm } from './';

export interface ReleaseInfo {
  name: string
  version: number
  source: string
  source_hash: string
  source_map?: string
  config: any
  secrets: any
  env: string
}

export class App {
  name: string
  env: string
  releaseInfo: ReleaseInfo
  private _config: any

  constructor(releaseInfo: ReleaseInfo) {
    this.name = releaseInfo.name
    this.env = releaseInfo.env
    this.releaseInfo = releaseInfo
  }

  get config() {
    if (this._config)
      return this._config
    this._config = this.releaseInfo.config
    parseConfig(this._config, this.releaseInfo.secrets)
    return this._config
  }

  get source() {
    return this.releaseInfo.source
  }

  get version() {
    return this.releaseInfo.version
  }

  get sourceHash() {
    return this.releaseInfo.source_hash
  }

  get sourceMap() {
    return this.releaseInfo.source_map
  }

  forV8() {
    return new ivm.ExternalCopy({
      name: this.name,
      config: this.config,
      version: this.version,
      env: this.env
    }).copyInto({ release: true })
  }
}