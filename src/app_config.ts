export class AppConfig {
  config: any
  code: string

  constructor(config: any) {
    this.config = config
  }

  getCode() {
    return this.code
  }
}