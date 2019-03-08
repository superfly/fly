import { registerBridge } from "./"
import { ivm } from "../"
import log from "../log"
import * as http from "http"
import * as https from "https"
import * as net from "net"
import { URL } from "url"
import { Bridge } from "./bridge"
import { Runtime } from "../runtime"
import { streamManager } from "../stream_manager"
import { isNumber } from "util"
import { setTimeout } from "timers"
import * as cacheHandler from "./fetch/cache"
import * as fileHandler from "./fetch/file"
import * as httpHandler from "./fetch/http"
import { FetchBody, dispatchError } from "./fetch/util"

const parseURL = process.env.FLY_ENV === "test" ? parseUrlWithRemapping : parseUrl

registerBridge("fetch", function fetchBridge(
  rt: Runtime,
  bridge: Bridge,
  urlStr: string,
  init: any,
  body: FetchBody,
  cb: ivm.Reference<() => void>
) {
  log.debug("native fetch with url:", urlStr)

  if (!init) {
    init = {}
  }

  const u = parseURL(urlStr)

  switch (u.protocol) {
    case httpHandler.httpsProtocol:
    case httpHandler.httpProtocol:
      return httpHandler.handleRequest(rt, bridge, u, init, body, cb)
    case fileHandler.protocol:
      return fileHandler.handleRequest(rt, bridge, u, init, body, cb)
    case cacheHandler.scheme:
      return cacheHandler.handleRequest(rt, bridge, u, init, body, cb)
  }

  dispatchError(cb, `Unsupported protocol: ${u.protocol}`)
})

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
