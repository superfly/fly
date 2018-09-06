import fetch, { RequestInit, Response } from "node-fetch";
import { URL } from "url";
import JestEnvironment from "./JestEnvironment";
import { TestServer } from "./EdgeContext";

export function install(env: JestEnvironment, global: {}) {
  Object.assign(global, {
    fetch: testFetch.bind(env),
    getServer: getServer.bind(env),
    translateUrl: translateUrl.bind(env)
  })
}

function testFetch(this: JestEnvironment, url: string, init?: RequestInit): Promise<Response> {
  const transformedUrl = this.currentContext.rewriteUrl(url)
  const parsedUrl = new URL(transformedUrl)

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

  return fetch(transformedUrl, init)
}

function getServer(this: JestEnvironment, host: string): TestServer {
  const server = this.currentContext.getServer(host)
  if (!server) {
    throw new Error(`Host ${host} not found`)
  }
  return server
}

function translateUrl(this: JestEnvironment, url: string): string {
  return this.currentContext.rewriteUrl(url)
}
