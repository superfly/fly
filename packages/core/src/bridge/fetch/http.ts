import { Runtime } from "../../runtime"
import { Bridge } from "../bridge"
import { ivm, IvmCallback } from "../../ivm"
import { URL } from "url"
import { FetchBody, dispatchError, dispatchFetchResponse, ResponseInit } from "./util"
import { streamManager } from "../../stream_manager"
import log from "../../log"
import * as http from "http"
import * as https from "https"
import * as net from "net"
import { isNumber } from "util"

export const httpProtocol = "http:"
export const httpsProtocol = "https:"

const connectionStats = {
  created: 0,
  current: 0,
  reused: 0,
  keptAlive: 0
}

export function handleRequest(rt: Runtime, bridge: Bridge, url: URL, init: any, body: FetchBody, cb: IvmCallback) {
  const httpFn = url.protocol === "http:" ? http.request : https.request
  const httpAgent = url.protocol === "http:" ? fetchAgent : fetchHttpsAgent

  const method = init.method || "GET"
  const headers = init.headers || {}

  let req: http.ClientRequest

  let timeout: NodeJS.Timer | undefined
  if (init.timeout && isNumber(init.timeout) && init.timeout > 0) {
    timeout = setTimeout(handleUserTimeout, init.timeout)
  }
  const reqOptions: https.RequestOptions = {
    agent: httpAgent,
    protocol: url.protocol,
    path: url.pathname + url.search, // should this include the hash fragment?
    hostname: url.hostname,
    host: url.host,
    port: url.port,
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
    } else if (typeof body === "number") {
      const stream = streamManager.get(rt, body)
      stream.pipe(req)
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
      host: url.host,
      path: url.pathname + url.search,
      remote_addr: res.socket.remoteAddress,
      status: res.statusCode,
      response_time: process.hrtime(start),
      globalConnectionStats: connectionStats
    })

    req.removeAllListeners()

    const respInit: ResponseInit = {
      status: res.statusCode,
      url,
      headers: res.headers as any, // normalize headers into Record<string, string>
      statusText: res.statusMessage
    }

    if (!(res.method === "GET" || res.method === "HEAD")) {
      respInit.body = streamManager.add(rt, res, { readTimeout: init.readTimeout })
    }

    dispatchFetchResponse(cb, respInit)
  }

  function handleError(err: Error) {
    clearFetchTimeout()
    log.error("error requesting http resource", err)
    dispatchError(cb, err)
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
    dispatchError(cb, "http request timeout")
    req.removeAllListeners()
    req.once("error", err => log.debug("error after fetch timeout:", err)) // swallow next errors
    req.once("timeout", () => log.debug("timeout after fetch timeout")) // swallow next errors
    req.abort()
  }

  function handleTimeout() {
    clearFetchTimeout()
    dispatchError(cb, "http request timeout")
    req.removeAllListeners()
    req.once("error", err => log.debug("error after timeout:", err)) // swallow possible error before abort
    req.abort()
  }
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

log.debug("Fetch connection pool:", { maxSockets, maxFreeSockets })

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
