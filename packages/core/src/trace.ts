import log from "./log"
const nsPerSecond = 1e9

export class Trace {
  public name: string
  public tags: any
  public children: Trace[] | undefined
  public parent: Trace | undefined

  private startTime?: [number, number]
  private diff?: [number, number]

  constructor(name: string, parent?: Trace) {
    this.name = name
    this.parent = parent
  }

  public start(name?: string, tags?: any): Trace {
    if (!name) {
      this.startTime = process.hrtime()
      return this
    } else {
      if (!this.name) {
        throw new Error('Trace spans need a name, call `t.trace("wat")`')
      }
      if (!this.children) {
        this.children = []
      }
      const t = Trace.start(name as string, this)
      this.children.push(t)
      return t
    }
  }

  public end(tags?: any) {
    if (!this.diff) {
      this.diff = process.hrtime(this.startTime)
    }
    if (tags) {
      this.addTags(tags)
    }
    if (this.children) {
      for (const c of this.children) {
        if (!c.diff) {
          c.end()
        }
      }
    }
    if (!this.parent) {
      // log.debug(`${this.name} took: ${this.milliseconds()}ms`)
      // log.debug(this.report())
    }
    log.debug(`${this.name} took: ${this.milliseconds()}ms`)
  }

  public addTags(tags: any) {
    if (!this.tags) {
      this.tags = {}
    }
    Object.assign(this.tags, tags)
  }

  public report(depth: number = 0) {
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
      for (const c of this.children) {
        r += c.report(depth + 1)
      }
    }
    return r
  }

  public nanoseconds() {
    if (!this.diff) {
      return 0
    }
    return this.diff[0] * nsPerSecond + this.diff[1]
  }

  public milliseconds() {
    return this.nanoseconds() / (1000 * 1000.0)
  }

  public static start = function(name: string, parent?: Trace) {
    const t: Trace = new Trace(name, parent)
    t.start()
    return t
  }

  public static tryStart = function(name: string, trace?: Trace) {
    if (trace) {
      return trace.start(name)
    } else {
      return Trace.start(name)
    }
  }
}
