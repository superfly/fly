/**
 * @module fly
 * @private
 */

/**
 * @class
 * @param {Object} [init]
 */
export class FlyHeaders implements Headers {
  private headerMap: Map<string, string[]> = new Map<string, string[]>()

  constructor(init?: HeadersInit) {
    if (init instanceof FlyHeaders) {
      const raw = init.toJSON()
      for (const name of Object.getOwnPropertyNames(raw)) {
        if (typeof raw[name] === "string") {
          this.append(name, raw[name] as any)
        } else {
          for (const value of raw[name]) {
            this.append(name, value)
          }
        }
      }
    } else if (Array.isArray(init)) {
      init.forEach(header => {
        if (!Array.isArray(header) || header.length !== 2) {
          throw TypeError()
        }
        this.append(header[0], header[1])
      })
    } else {
      init = Object(init)
      for (const name of Object.keys(init)) {
        if (Array.isArray(init[name])) {
          init[name].forEach(v => {
            this.append(name, v)
          })
        } else {
          this.set(name, init[name])
        }
      }
    }
  }

  /**
   * Adds a header. Does not overwrite existing headers with same name
   * @param {String} name
   * @param {String} value
   */
  public append(name: string, value: string): void {
    name = name.toLowerCase()
    if (this.headerMap.has(name)) {
      this.headerMap.get(name).push(value)
    } else {
      this.set(name, value)
    }
  }

  /**
   * Deletes header(s) by name
   * @param {String} name
   */
  public delete(name: string): void {
    name = name.toLowerCase()
    this.headerMap.delete(name)
  }

  /**
   * Gets first header by name
   * @param {String} name
   * @returns {String?}
   */
  public get(name: string): string | null {
    name = name.toLowerCase()
    const values = this.headerMap.get(name)
    if (!values || values.length === 0) {
      return null
    }

    return this.headerMap.get(name).join(", ")
  }

  public getAll(name: string): string[] {
    return this.headerMap.get(name.toLowerCase()) || []
  }

  /**
   * Checks for existence of header by name
   * @param {String} name
   * @returns {boolean}
   */
  public has(name: string): boolean {
    return this.headerMap.has(name) && this.headerMap.get(name).length > 0
  }

  /**
   * Sets a header by name. Overwrites existing headers with same name
   * @param {String} name
   * @param {String} value
   */
  public set(name: string, value: string | string[]): void {
    name = name.toLowerCase()
    if (Array.isArray(value)) {
      this.headerMap.set(name, value)
    } else {
      this.headerMap.set(name, [value])
    }
  }

  /**
   * @returns {Object<string,string[]>}
   */
  public toJSON(): { [key: string]: string[] } {
    const payload = {}
    for (const [name, value] of [...this.headerMap]) {
      if (name === "host") {
        payload[name] = value[0]
      } else {
        payload[name] = value
      }
    }
    return payload
  }

  public forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void {
    this.headerMap.forEach((value, key) => {
      callbackfn(value.join(", "), key, this)
    })
  }

  public *keys(): IterableIterator<string> {
    for (const [name, _] of this) {
      yield name
    }
  }

  public *values(): IterableIterator<string> {
    for (const [_, value] of this) {
      yield value
    }
  }

  public *entries(): IterableIterator<[string, string]> {
    for (const [name, values] of this.headerMap.entries()) {
      yield [name, values.join(", ")]
    }
  }

  public [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()
  }
}

export { FlyHeaders as Headers }
