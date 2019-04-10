import { Runtime } from "../../runtime"
import { Bridge } from "../bridge"
import { streamManager } from "../../stream_manager"
import log from "../../log"
import * as http from "http"
import * as https from "https"
import * as net from "net"
import { isNumber } from "util"
import { RequestInit, URL, FetchBody, ResponseInit } from "./types"

export const httpProtocol = "http:"
export const httpsProtocol = "https:"

export function handleRequest(
  rt: Runtime,
  bridge: Bridge,
  url: URL,
  init: RequestInit,
  body: FetchBody
): Promise<ResponseInit> {
  return new Promise((resolve, reject) => {
    try {
      const httpFn = url.protocol === httpProtocol ? http.request : https.request
      const httpAgent = getAgent(rt, url.protocol)

      let req: http.ClientRequest
      let timeout: NodeJS.Timer | undefined

      if (isNumber(init.timeout) && init.timeout > 0) {
        timeout = setTimeout(handleUserTimeout, init.timeout)
      }

      const reqOptions: https.RequestOptions = {
        agent: httpAgent,
        protocol: url.protocol,
        path: url.pathname + url.search,
        hostname: url.hostname,
        host: url.host,
        port: url.port,
        method: init.method,
        headers: init.headers,
        timeout: 60 * 1000
      }

      if (init.certificate) {
        reqOptions.key = init.certificate.key
        reqOptions.cert = init.certificate.cert
        reqOptions.pfx = init.certificate.pfx
        reqOptions.ca = init.certificate.ca
        reqOptions.passphrase = init.certificate.passphrase
      }

      if (httpFn === https.request) {
        if (init.tls && init.tls.servername) {
          reqOptions.servername = init.tls.servername
        } else {
          reqOptions.servername = reqOptions.hostname
        }
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
          method: init.method,
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
          headers: res.headers as any, // normalize headers into Record<string, string>
          statusText: res.statusMessage
        }

        if (!(res.method === "GET" || res.method === "HEAD")) {
          respInit.body = streamManager.add(rt, res, { readTimeout: init.readTimeout })
        }

        resolve(respInit)
      }

      function handleError(err: Error) {
        clearFetchTimeout()
        log.error("error requesting http resource", err)
        reject(err)
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
        reject("http request timeout")
        req.removeAllListeners()
        req.once("error", err => log.debug("error after fetch timeout:", err)) // swallow next errors
        req.once("timeout", () => log.debug("timeout after fetch timeout")) // swallow next errors
        req.abort()
      }

      function handleTimeout() {
        clearFetchTimeout()
        reject("http request timeout")
        req.removeAllListeners()
        req.once("error", err => log.debug("error after timeout:", err)) // swallow possible error before abort
        req.abort()
      }
    } catch (err) {
      reject(err)
    }
  })
}

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

let maxSockets = parseInt(process.env.MAX_FETCH_SOCKETS || "", 10)
if (isNaN(maxSockets) || maxSockets < 1) {
  maxSockets = 1024 // maybe sane limit
}

let maxFreeSockets = parseInt(process.env.MAX_FETCH_FREE_SOCKETS || "", 10)
if (isNaN(maxFreeSockets) || maxFreeSockets < 1) {
  maxFreeSockets = 256 // default
}

log.debug("Fetch connection pool:", { maxSockets, maxFreeSockets })

const runtimeAgents = new Map<string, http.Agent>()

function getAgent(rt: Runtime, protocol: string): http.Agent {
  const key = `${rt.app.id}:${protocol}`
  let agent = runtimeAgents.get(key)

  if (!agent) {
    if (protocol === "http:") {
      agent = createMonitoredAgent(
        new http.Agent({
          keepAlive: true,
          keepAliveMsecs: 1000,
          maxSockets,
          maxFreeSockets
        })
      )
    } else if (protocol === "https:") {
      agent = createMonitoredAgent(
        new https.Agent({
          keepAlive: true,
          keepAliveMsecs: 1000,
          rejectUnauthorized: false,
          maxSockets,
          maxFreeSockets
        })
      )
    } else {
      throw new Error("Unsupported protocol " + protocol)
    }

    runtimeAgents.set(key, agent)
  }

  return agent
}

function destroyIdleAgents() {
  for (const [name, agent] of runtimeAgents) {
    const sockets = Object.keys(agent.sockets).length
    const requests = Object.keys(agent.requests).length
    if (sockets === 0 && requests === 0) {
      log.debug("destroying http agent pool", name)
      agent.destroy()
      runtimeAgents.delete(name)
    }
  }
}

setInterval(destroyIdleAgents, 30000).unref()
