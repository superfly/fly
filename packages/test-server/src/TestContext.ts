import fetch, { RequestInit, Response } from "node-fetch"
import { Environment } from "./Environment"
import { URL } from "url"

export class TestContext {
  private readonly env: Environment

  public constructor(env: Environment) {
    this.env = env
  }

  public async fetch(url: string, init?: RequestInit): Promise<Response> {
    const transformedUrl = this.env.hostMap.transformUrl(url)
    const parsedUrl = new URL(transformedUrl)
    return await fetch(transformedUrl, Object.assign({}, init, {
      headers: {
        "user-agent": "test-server/fetch",
        'Host': parsedUrl.hostname
      }
    }))
  }
}