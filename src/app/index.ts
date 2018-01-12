export class App {
  id: string
  settings?: any
  code: string

  constructor(conf: any) {
    this.id = conf.id
    this.settings = conf.settings
    this.code = conf.code
  }
}