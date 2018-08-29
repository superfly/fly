import fetch, { RequestInit, Response } from "node-fetch"
import { Environment } from "./Environment"
import * as URL from "url"

export class TestContext {
  private readonly env: Environment

  public constructor(env: Environment) {
    this.env = env
  }

  public async fetch(url: string, init?: RequestInit): Promise<Response> {
    const transformedUrl = this.env.hostMap.transformUrl(url)
    if (!transformedUrl.href) {
      throw new Error("error parsing url: " + url)
    }
    url = URL.format(transformedUrl)
    const init2 = Object.assign({}, init, {
      headers: {
        "user-agent": "test-server/fetch",
        'Host': transformedUrl.host
      }
    })
    return await fetch(url, init2)
  }
}