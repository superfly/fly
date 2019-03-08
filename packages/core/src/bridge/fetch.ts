import { registerBridge } from "./"
import log from "../log"
import { Bridge } from "./bridge"
import { Runtime } from "../runtime"
import * as cacheHandler from "./fetch/cache"
import * as fileHandler from "./fetch/file"
import * as httpHandler from "./fetch/http"
import { ivm, dispatchError, IvmCallback } from "../ivm"
import { RequestInit, FetchBody, URL, ResponseInit } from "./fetch/types"
import { STATUS_CODES } from "http"

const parseURL = process.env.FLY_ENV === "test" ? parseUrlWithRemapping : parseUrl

registerBridge("fetch", function fetchBridge(
  rt: Runtime,
  bridge: Bridge,
  url: string,
  init: RequestInit,
  body: FetchBody,
  cb: ivm.Reference<() => void>
) {
  log.debug("native fetch with url:", url)

  const parsedUrl = parseURL(url)
  const handler = getRequestHandler(parsedUrl)

  if (!handler) {
    dispatchError(cb, `Unsupported protocol: ${parsedUrl.protocol}`)
    return
  }

  if (!init) {
    init = {}
  }
  if (!init.method) {
    init.method = "GET"
  }
  if (!init.headers) {
    init.headers = {}
  }

  handler(rt, bridge, parsedUrl, init, body)
    .then(resp => {
      dispatchFetchResponse(cb, { url, ...resp })
    })
    .catch(err => {
      dispatchError(cb, err)
    })
})

function getRequestHandler(url: URL) {
  switch (url.protocol) {
    case httpHandler.httpsProtocol:
    case httpHandler.httpProtocol:
      return httpHandler.handleRequest
    case fileHandler.protocol:
      return fileHandler.handleRequest
    case cacheHandler.scheme:
      return cacheHandler.handleRequest
  }
}

export function dispatchFetchResponse(cb: IvmCallback, response: ResponseInit & { url: string }) {
  const { body = "", ...init } = response

  if (!init.status) {
    init.status = 200
  }
  if (!init.statusText) {
    init.statusText = STATUS_CODES[init.status] || ""
  }

  cb.applyIgnored(null, [null, new ivm.ExternalCopy(init).copyInto({ release: true }), body])
}

// Support rewriting fetch urls in e2e tests. This could get replaced with fly-proxy someday

const hostnameAliases = new Map<string, string>()

function parseUrl(val: string): URL {
  return new URL(val)
}

function parseUrlWithRemapping(val: string): URL {
  const url = new URL(val)

  if (url.host && hostnameAliases.has(url.host)) {
    const hostname = hostnameAliases.get(url.host)!
    const [host, port] = hostname.split(":")
    url.hostname = host
    url.host = host
    url.port = port
  }

  return url
}

if (process.env.FLY_ENV === "test") {
  process.on("message", msg => {
    if (msg.type === "alias-hostname") {
      hostnameAliases.set(msg.alias, msg.hostname)
    }
  })
}
