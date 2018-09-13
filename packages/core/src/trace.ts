import log from './log'
const nsPerSecond = 1e9

export class Trace {
  name: string
  tags: any
  children: Trace[] | undefined
  parent: Trace | undefined

  private startTime?: [number, number]
  private diff?: [number, number]

  constructor(name: string, parent?: Trace) {
    this.name = name
    this.parent = parent
  }

  start(name?: string, tags?: any): Trace {
    if (!name) {
      this.startTime = process.hrtime()
      return this
    } else {
      if (!this.name) {
        throw 'Trace spans need a name, call `t.trace("wat")`'
      }
      if (!this.children) {
        this.children = []
      }
      let t = Trace.start(<string>name, this)
      this.children.push(t)
      return t
    }
  }

  end(tags?: any) {
    if (!this.diff) {
      this.diff = process.hrtime(this.startTime)
    }
    if (tags) {
      this.addTags(tags)
    }
    if (this.children) {
      for (let c of this.children) {
        if (!c.diff) {
          c.end()
        }
      }
    }
    if (!this.parent) {
      //log.debug(`${this.name} took: ${this.milliseconds()}ms`)
      //log.debug(this.report())
    }
    log.debug(`${this.name} took: ${this.milliseconds()}ms`)
  }

  addTags(tags: any) {
    if (!this.tags) {
      this.tags = {}
    }
    Object.assign(this.tags, tags)
  }

  report(depth: number = 0) {
    let r = ""
    let prefix = "\n--"
    for (let i = 0; i < depth; i++) {
      prefix += "--"
    }
    r = `${prefix} ${this.name}: ${this.milliseconds()}ms`
    if (this.tags) {
      r += prefix + "  -> " + JSON.stringify(this.tags)
    }
    if (this.children) {
      for (let c of this.children) {
        r += c.report(depth + 1)
      }
    }
    return r
  }

  nanoseconds() {
    if (!this.diff)
      return 0
    return this.diff[0] * nsPerSecond + this.diff[1]
  }

  milliseconds() {
    return this.nanoseconds() / (1000 * 1000.0)
  }

  static start = function (name: string, parent?: Trace) {
    let t: Trace = new Trace(name, parent)
    t.start()
    return t
  }

  static tryStart = function (name: string, trace?: Trace) {
    if (trace) {
      return trace.start(name)
    } else {
      return Trace.start(name)
    }
  }
}