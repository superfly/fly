import log from './log'
const nsPerSecond = 1e9

export class Trace {
  name: string
  private startTime: [number, number]
  private diff: [number, number]

  constructor(name: string) {
    this.name = name
  }

  start() {
    this.startTime = process.hrtime()
  }

  end() {
    this.diff = process.hrtime(this.startTime)
    log.debug(`${this.name} took: ${this.milliseconds()}ms`)
    return this
  }

  nanoseconds() {
    return this.diff[0] * nsPerSecond + this.diff[1]
  }

  milliseconds() {
    return this.nanoseconds() / (1000 * 1000.0)
  }

  static start = function (name: string) {
    let t: Trace = new Trace(name)
    t.start()
    return t
  }
}