import { parse, format } from "url"

export interface HostOptions {
  protocol?: string
  hostname?: string
  port?: string
}

export class HostMap {
  private readonly map = new Map<string, HostOptions>()

  public add(host: string, options: HostOptions) {
    // console.debug(`Mapping host [${host}] => ${JSON.stringify(options)}`)
    this.map.set(host, options)
  }

  public transformUrl(url: string): string {
    const parsedUrl = parse(url)
    if (!parsedUrl.hostname) {
      return url
    }
    const hostOptions = this.map.get(parsedUrl.hostname)
    if (!hostOptions) {
      return url
    }
    parsedUrl.host = hostOptions.hostname + ":" + hostOptions.port
    parsedUrl.hostname = hostOptions.hostname
    parsedUrl.port = hostOptions.port
    return format(parsedUrl)
  }

  public copy() {
    const copy = new HostMap()
    this.map.forEach((v, k) => {
      copy.add(k, v)
    })
    return copy
  }
}