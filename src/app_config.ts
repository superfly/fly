export class AppConfig {
  config: any
  code: string

  constructor(config: any, code?: string) {
    this.config = config
    if (code)
      this.code = code
  }

  getCode() {
    return this.code
  }
}