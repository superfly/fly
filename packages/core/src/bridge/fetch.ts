import { registerBridge } from "./"

import { ivm } from "../"
import log from "../log"
import * as http from "http"
import * as https from "https"
import * as net from "net"
import { parse as parseURL } from "url"

import { Bridge } from "./bridge"
import { Runtime } from "../runtime"
import { streamManager } from "../stream_manager"
import { isNumber } from "util"
import { setTimeout } from "timers"

const connectionStats = {
  created: 0,
  current: 0,
  reused: 0,
  keptAlive: 0
}

// this keeps track of connection counts for the fetch agent
function createMonitoredAgent<T extends http.Agent>(agent: T) {
  const a: any = agent
  const { createConnection, keepSocketAlive, reuseSocket } = a
  return Object.assign(agent, {
    createConnection: function createConnectionMonitored(options: any, cb: any) {
      const socket: net.Socket = createConnection.call(this, options, cb)
      connectionStats.created += 1
      connectionStats.current += 1
      socket.on("close", function decrementConnectionCounter() {
        connectionStats.current -= 1
      })
      return socket
    },
    keepSocketAlive: function keepSocketAliveMonitored(socket: net.Socket) {
      connectionStats.keptAlive += 1
      return keepSocketAlive.call(this, socket)
    },
    reuseSocket: function reuseSocketMonitored(socket: net.Socket, request: any) {
      connectionStats.reused += 1
      return reuseSocket.call(this, socket, request)
    }
  })
}

// tslint:disable-next-line
let maxSockets = parseInt(process.env.MAX_FETCH_SOCKETS || "")
if (isNaN(maxSockets) || maxSockets < 1) {
  maxSockets = 1024 // maybe sane limit
}
// tslint:disable-next-line
let maxFreeSockets = parseInt(process.env.MAX_FETCH_FREE_SOCKETS || "")
if (isNaN(maxFreeSockets) || maxFreeSockets < 1) {
  maxFreeSockets = 256 // default
}

console.log("Fetch connection pool:", { maxSockets, maxFreeSockets })
const fetchAgent = createMonitoredAgent(
  new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 5 * 1000,
    maxSockets,
    maxFreeSockets
  })
)
const fetchHttpsAgent = createMonitoredAgent(
  new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    rejectUnauthorized: false, // for simplicity
    maxSockets,
    maxFreeSockets
  })
)

function makeResponse(status: number, statusText: string, url: string, headers?: any) {
  return {
    status,
    statusText,
    ok: status >= 200 && status < 300,
    url,
    headers: headers || {}
  }
}
registerBridge("fetch", function fetchBridge(
  rt: Runtime,
  bridge: Bridge,
  urlStr: string,
  init: any,
  body: ArrayBuffer | null | string,
  cb: ivm.Reference<() => void>
) {
  log.debug("native fetch with url:", urlStr)
  if (!init) {
    init = {}
  }
  const u = parseURL(urlStr)

  if (u.protocol === "file:") {
    if (!bridge.fileStore) {
      cb.applyIgnored(null, ["no file store configured, should not happen!"])
      return
    }

    if (init.method && init.method !== "GET") {
      cb.applyIgnored(null, [null, makeResponse(405, "Method Not Allowed", urlStr)])
      return
    }

    try {
      bridge.fileStore
        .createReadStream(rt, urlStr.replace("file://", ""))
        .then(stream => {
          const id = streamManager.add(rt, stream)
          cb.applyIgnored(null, [
            null,
            new ivm.ExternalCopy(makeResponse(200, "OK", urlStr)).copyInto({ release: true }),
            id
          ])
        })
        .catch(err => {
          cb.applyIgnored(null, [
            null,
            new ivm.ExternalCopy(makeResponse(404, "Not Found", urlStr)).copyInto({
              release: true
            }),
            ""
          ])
        })
    } catch (e) {
      // Might throw FileNotFound
      cb.applyIgnored(null, [
        null,
        new ivm.ExternalCopy(makeResponse(404, "Not Found", urlStr)).copyInto({ release: true }),
        ""
      ])
    }
    return
  }

  const httpFn = u.protocol === "http:" ? http.request : https.request
  const httpAgent = u.protocol === "http:" ? fetchAgent : fetchHttpsAgent

  const method = init.method || "GET"
  const headers = init.headers || {}

  let req: http.ClientRequest

  let path = u.pathname
  if (u.query != null) {
    path = path + "?" + u.query
  }
  let timeout: NodeJS.Timer | undefined
  if (init.timeout && isNumber(init.timeout) && init.timeout > 0) {
    timeout = setTimeout(handleUserTimeout, init.timeout)
  }
  const reqOptions: https.RequestOptions = {
    agent: httpAgent,
    protocol: u.protocol,
    path,
    hostname: u.hostname,
    host: u.host,
    port: u.port,
    method,
    headers,
    timeout: 60 * 1000
  }

  if (httpFn === https.request) {
    reqOptions.servername = reqOptions.hostname
  }
  req = httpFn(reqOptions)
  req.setNoDelay(true)

  req.setHeader("fly-app", rt.app.name)

  req.once("error", handleError)
  req.once("timeout", handleTimeout)
  req.once("response", handleResponse)

  const start = process.hrtime()
  const startData = (req.connection && req.connection.bytesWritten) || 0

  setImmediate(() => {
    if (body instanceof ArrayBuffer) {
      req.end(Buffer.from(body))
    } else {
      req.end(!!body ? body : null)
    }
  })

  return

  function clearFetchTimeout() {
    if (timeout) {
      clearInterval(timeout)
    }
  }
  function handleResponse(res: http.IncomingMessage) {
    res.once("error", handleError)
    const dataOut = req.connection.bytesWritten - startData
    clearFetchTimeout()
    rt.reportUsage("fetch", {
      data_out: dataOut,
      method,
      host: u.host,
      path: u.path,
      remote_addr: res.socket.remoteAddress,
      status: res.statusCode,
      response_time: process.hrtime(start),
      globalConnectionStats: connectionStats
    })
    console.log("Connection stats:", connectionStats)

    req.removeAllListeners()

    const retInit = new ivm.ExternalCopy({
      status: res.statusCode,
      statusText: res.statusMessage,
      ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 400,
      url: urlStr,
      headers: res.headers
    }).copyInto({ release: true })

    if (res.headers.connection === "close") {
      console.log("Got connection: close")
    }
    if (res.method === "GET" || res.method === "HEAD") {
      return cb.applyIgnored(null, [null, retInit])
    }

    cb.applyIgnored(null, [null, retInit, streamManager.add(rt, res, { readTimeout: init.readTimeout })])
  }

  function handleError(err: Error) {
    clearFetchTimeout()
    log.error("error requesting http resource", err)
    cb.applyIgnored(null, [(err && err.toString()) || "unknown error"])
    req.removeAllListeners()
    if (!req.aborted) {
      try {
        req.abort()
      } catch (e) {
        // ignore
      }
    }
  }

  function handleUserTimeout() {
    clearFetchTimeout()
    log.error("fetch timeout")
    cb.applyIgnored(null, ["http request timeout"])
    req.removeAllListeners()
    req.once("error", err => log.debug("error after fetch timeout:", err)) // swallow next errors
    req.once("timeout", () => log.debug("timeout after fetch timeout")) // swallow next errors
    req.abort()
  }
  function handleTimeout() {
    clearFetchTimeout()
    cb.applyIgnored(null, ["http request timeout"])
    req.removeAllListeners()
    req.once("error", err => log.debug("error after timeout:", err)) // swallow possible error before abort
    req.abort()
  }
})
