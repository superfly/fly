import fetch, { RequestInit, Response } from "node-fetch"
import { Environment, TestServer } from "./Environment"
import { URL, parse, format } from "url"
import * as http from "http"

export class TestContext {
  private readonly env: Environment

  public constructor(env: Environment) {
    this.env = env
  }

  public async fetch(url: string, init?: RequestInit): Promise<Response> {
    const transformedUrl = this.env.hostMap.transformUrl(url)
    const parsedUrl = new URL(transformedUrl)
    // try {

    if (!init) {
      init = {}
    }

    const headers: { [name: string]: string } = Object.assign({}, {
      "user-agent": "test-server/fetch",
      'Host': parsedUrl.hostname
    }, init.headers)

    // node-fetch overrides Accept-Encoding w/ "gzip,deflate" unless init.compress is false
    // disable compression if init includes an Accept-Encoding header
    // see: https://github.com/bitinn/node-fetch/issues/465
    for (const [name, value] of Object.entries(headers)) {
      if (name.toLowerCase() !== "accept-encoding") {
        continue
      }
      init.compress = false
    }

    init.headers = headers

    return await fetch(transformedUrl, init)
    // } catch (error) {
    //   throw new Error("Fetch error: " + error)
    // }
  }

  public getServer(host: string): TestServer {
    const server = this.env.getServer(host)
    if (!server) {
      throw new Error(`Host ${host} not found`)
    }
    return server
  }

  public translateUrl(url: string): string {
    return this.env.hostMap.transformUrl(url)
  }
}