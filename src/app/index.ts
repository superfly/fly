export class App {
  id: string
  settings?: any
  rules?: any[]
  backends?: any[]
  code: string

  constructor(conf: any) {
    this.id = conf.id
    this.settings = conf.settings
    this.rules = conf.rules
    this.backends = conf.backends
    this.code = conf.code
  }
}