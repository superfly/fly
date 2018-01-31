import { parseConfig } from './config'

export interface ReleaseInfo {
  app_id: string
  version: number
  source: string
  source_hash: string
  config: any
  secrets: any
}

export class App {
  id: string
  releaseInfo: ReleaseInfo
  private _config: any

  constructor(releaseInfo: ReleaseInfo) {
    this.id = releaseInfo.app_id
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
}