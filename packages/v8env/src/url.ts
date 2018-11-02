/*
 inspired from
 https://raw.githubusercontent.com/github/url-polyfill/master/url.js
 and https://stackoverflow.com/questions/6168260/how-to-parse-a-url
*/
/* tslint:disable */

export interface URLParts {
  protocol: string
  username: string
  password: string
  hostname: string
  port: string
  path: string
  query: string
  hash: string
}

let createIterator: (items: any[]) => any

if (Symbol && Symbol.iterator && typeof [][Symbol.iterator] === "function") {
  createIterator = (items: any[]) => {
    return items[Symbol.iterator]()
  }
} else {
  createIterator = (items: any[]) => {
    return {
      next: function() {
        const value = items.shift()
        return { done: value === void 0, value: value }
      }
    }
  }
}

/**
 * Encodes a path segment.
 * RFC 3986 reserves !, ', (, ), and * and the implementation pipes the
 * output of encodeURIComponent to a hex encoding pass for these special
 * characters.
 */
function encodePathSegment(segment) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, c => {
    return "%" + c.charCodeAt(0).toString(16)
  })
}

export { URLSearchParams } from "./url_search_params"

export class URL {
  // createObjectURL(object: any, options?: ObjectURLOptions): string;
  // revokeObjectURL(url: string): void;

  private static patterns: any = {
    protocol: "(?:([^:/?#]+):)",
    authority: "(?://([^/?#]*))",
    path: "([^?#]*)",
    query: "(\\?[^#]*)",
    hash: "(#.*)",

    authentication: "(?:([^:]*)(?::([^@]*))?@)",
    hostname: "([^:]+)",
    port: "(?::(\\d+))"
  }

  private static URLRegExp: RegExp
  private static AuthorityRegExp: RegExp

  static init() {
    this.URLRegExp = new RegExp(
      "^" +
        this.patterns.protocol +
        "?" +
        this.patterns.authority +
        "?" +
        this.patterns.path +
        this.patterns.query +
        "?" +
        this.patterns.hash +
        "?"
    )
    this.AuthorityRegExp = new RegExp(
      "^" + this.patterns.authentication + "?" + this.patterns.hostname + this.patterns.port + "?$"
    )
  }

  static parse(url: string): URLParts {
    const urlMatch = this.URLRegExp.exec(url)
    if (urlMatch !== null) {
      const authorityMatch = urlMatch[2] ? this.AuthorityRegExp.exec(urlMatch[2]) : [null, null, null, null, null]
      if (authorityMatch !== null) {
        return {
          protocol: urlMatch[1] || "",
          username: authorityMatch[1] || "",
          password: authorityMatch[2] || "",
          hostname: authorityMatch[3] || "",
          port: authorityMatch[4] || "",
          path: urlMatch[3] || "",
          query: urlMatch[4] || "",
          hash: urlMatch[5] || ""
        }
      }
    }

    throw new Error("Invalid URL")
  }

  protected _parts: URLParts

  constructor(url: string, base?: string) {
    let baseParts: URLParts
    try {
      baseParts = URL.parse(base)
    } catch (e) {
      throw new Error("Invalid base URL")
    }

    let urlParts = URL.parse(url)

    if (urlParts.protocol) {
      this._parts = { ...urlParts }
    } else {
      this._parts = {
        protocol: baseParts.protocol,
        username: baseParts.username,
        password: baseParts.password,
        hostname: baseParts.hostname,
        port: baseParts.port,
        path: urlParts.path || baseParts.path,
        query: urlParts.query || baseParts.query,
        hash: urlParts.hash
      }
    }

    // console.log(URL.parse(base), URL.parse(url), this._parts);
  }

  get hash(): string {
    return this._parts.hash
  }

  set hash(value: string) {
    value = value.toString()
    if (value.length === 0) {
      this._parts.hash = ""
    } else {
      if (value.charAt(0) !== "#") value = "#" + value
      this._parts.hash = encodeURIComponent(value)
    }
  }

  get host(): string {
    return this.hostname + (this.port ? ":" + this.port : "")
  }

  set host(value: string) {
    value = value.toString()
    const url: URL = new URL("http://" + value)
    this._parts.hostname = url.hostname
    this._parts.port = url.port
  }

  get hostname(): string {
    return this._parts.hostname
  }

  set hostname(value: string) {
    value = value.toString()
    this._parts.hostname = encodeURIComponent(value)
  }

  get href(): string {
    // TEST
    const authentication: string =
      this.username || this.password ? this.username + (this.password ? ":" + this.password : "") + "@" : ""

    return this.protocol + "//" + authentication + this.host + this.pathname + this.search + this.hash
  }

  set href(value: string) {
    value = value.toString()
    const url: URL = new URL(value)
    this._parts = { ...(url as any)._parts }
  }

  get origin(): string {
    return this.protocol + "//" + this.host
  }

  get password(): string {
    return this._parts.password
  }

  set password(value: string) {
    value = value.toString()
    this._parts.password = encodeURIComponent(value)
  }

  get pathname(): string {
    return this._parts.path ? this._parts.path : "/"
  }

  set pathname(value: string) {
    let chunks = value
      .toString()
      .split("/")
      .map(encodePathSegment)
    if (chunks[0]) {
      // ensure joined string starts with slash.
      chunks.unshift("")
    }
    this._parts.path = chunks.join("/")
  }

  get port(): string {
    return this._parts.port
  }

  set port(value: string) {
    let port = parseInt(value)
    if (isNaN(port)) {
      this._parts.port = "0"
    } else {
      this._parts.port = Math.max(0, port % 2 ** 16).toString()
    }
  }

  get protocol(): string {
    return this._parts.protocol + ":"
  }

  set protocol(value: string) {
    value = value.toString()
    if (value.length !== 0) {
      if (value.charAt(value.length - 1) === ":") {
        value = value.slice(0, -1)
      }
      this._parts.protocol = encodeURIComponent(value)
    }
  }

  get search(): string {
    return this._parts.query
  }

  set search(value: string) {
    value = value.toString()
    if (value.charAt(0) !== "?") value = "?" + value
    this._parts.query = value
  }

  get username(): string {
    return this._parts.username
  }

  set username(value: string) {
    value = value.toString()
    this._parts.username = encodeURIComponent(value)
  }

  get searchParams(): URLSearchParams {
    const searchParams = new URLSearchParams(this.search)
    ;["append", "delete", "set"].forEach((methodName: string) => {
      const method = searchParams[methodName]
      searchParams[methodName] = (...args) => {
        method.apply(searchParams, args)
        this.search = searchParams.toString()
      }
    })
    return searchParams
  }

  toString(): string {
    return this.href
  }
}

URL.init()
