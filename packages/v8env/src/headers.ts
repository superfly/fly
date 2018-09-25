/**
 * @module fly
 * @private
 */
import { logger } from "./logger"

/**
 * @class
 * @param {Object} [init]
 */
export default class FlyHeaders implements Headers {
  private headerMap: { [key: string]: string[] } = {};

  constructor(init?: HeadersInit) {
    if (init instanceof Headers) {
      init.forEach((val, key) => {
        this.append(key, val);
      })
    } else if (Array.isArray(init)) {
      init.forEach((header) => {
        if (!Array.isArray(header) || header.length !== 2) throw TypeError();
        this.append(header[0], header[1]);
      });
    } else {
      init = Object(init);
      for (const name of Object.keys(init)) {
        if (Array.isArray(init[name])) {
          init[name].forEach((v) => {
            this.append(name, v);
          })
        } else {
          this.set(name, init[name]);
        }
      }
    }
  }

  // void append(ByteString name, ByteString value);
	/**
	 * Adds a header. Does not overwrite existing headers with same name
	 * @param {String} name
	 * @param {String} value
	 */
  public append(name: string, value: string): void {
    name = name.toLowerCase();
    if (this.headerMap[name]) {
      this.headerMap[name].push(name)
    } else {
      this.set(name, value);
    }
  }

  /** Deletes header(s) by name
   * @param {String} name */
  public delete(name: string): void {
    name = name.toLowerCase();
    delete this.headerMap[name];
  }

  /**
   * Gets first header by name
   * @param {String} name
   * @returns {String?}
   */
  public get(name: string): string | null {
    name = name.toLowerCase();
    if (name === 'cookie' || name === 'set-cookie') {
      return this.headerMap[name][0] || null;
    }

    if (this.headerMap[name] && this.headerMap[name].length > 0) {
      return this.headerMap[name].join(", ");
    }
    return null;
  }

  public getAll(name: string): string[] {
    return this.headerMap[name.toLowerCase()] || [];
  }

  /**
   * Checks for existence of header by name
   * @param {String} name
   * @returns {boolean}
   */
  public has(name: string): boolean {
    name = name.toLowerCase();
    return this.headerMap[name] && this.headerMap[name].length > 0;
  }

  /**
   * Sets a header by name. Overwrites existing headers with same name
   * @param {String} name
   * @param {String} value
   */
  public set(name: string, value: string | string[]): void {
    name = name.toLowerCase();
    if (Array.isArray(value)) {
      this.headerMap[name] = value
    } else {
      this.headerMap[name] = [value];
    }
  }

  /**
   * @returns {Object<string,string[]>}
   */
  public toJSON(): { [key: string]: string[] } {
    return { ...this.headerMap };
  }

  public forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void {
    const cb = thisArg ? callbackfn.bind(thisArg) : callbackfn;
    for (const key in this.headerMap) {
      if (key === "cookie" || key === "set-cookie") {
        for (const valueIdx in this.headerMap[key]) {
          cb(this.headerMap[key][valueIdx], key, this);
        }
      } else {
        cb(this.get(key), key, this);
      }
    }
  }
}
