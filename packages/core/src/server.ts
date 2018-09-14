import * as http from "http"
import { ivm } from "./"
import * as zlib from "zlib"
import log from "./log"
import * as httpUtils from "./utils/http"
import { Writable } from "stream"
import { App } from "./app"

import { FileAppStore } from "./file_app_store"
import { Bridge } from "./bridge/bridge"
import { LocalFileStore } from "./local_file_store"
import { randomBytes } from "crypto"
import { LocalRuntime } from "./local_runtime"
import { Runtime } from "./runtime"
import { SQLiteDataStore } from "./sqlite_data_store"
import { streamManager } from "./stream_manager"

const hopHeaders = [
  // From RFC 2616 section 13.5.1
  "Connection",
  "Keep-Alive",
  "Proxy-Authenticate",
  "Proxy-Authorization",
  "TE",
  "Trailers",
  "Transfer-Encoding",
  "Upgrade",

  // We don't want to trigger upstream HTTPS redirect
  "Upgrade-Insecure-Requests"
]

export interface RequestMeta {
  app?: App
  startedAt?: [number, number] //process.hrtime() ya know
  endedAt?: [number, number]
  id?: string
  originalURL?: string
}

declare module "http" {
  interface IncomingMessage {
    protocol: string
  }
}

export interface ServerOptions {
  env?: string
  appStore?: FileAppStore
  bridge?: Bridge
  inspect?: boolean
  monitorFrequency?: number
}

export interface RequestTask {
  request: http.IncomingMessage
  response: http.ServerResponse
}

export class Server extends http.Server {
  options: ServerOptions

  bridge: Bridge
  runtime: LocalRuntime
  appStore: FileAppStore

  constructor(options: ServerOptions = {}) {
    super()
    this.options = options
    this.appStore = options.appStore || new FileAppStore(process.cwd())
    this.bridge =
      options.bridge ||
      new Bridge({
        fileStore: new LocalFileStore(process.cwd(), this.appStore.release),
        dataStore: new SQLiteDataStore(this.appStore.app.name, options.env || "development")
      })
    this.runtime = new LocalRuntime(this.appStore.app, this.bridge, {
      inspect: !!options.inspect,
      monitorFrequency: options.monitorFrequency
    })
    this.on("request", this.handleRequest.bind(this))
    this.on("listening", () => {
      const addr = this.address()
      console.log(`Server listening on ${addr.address}:${addr.port}`)
    })
  }

  private async handleRequest(request: http.IncomingMessage, response: http.ServerResponse) {
    // request.pause()
    const start = process.hrtime()
    const reqId = randomBytes(12).toString("hex")
    if (request.url === undefined)
      // typescript check fix
      return

    if (request.headers.host === undefined) return

    if (request.url == undefined) {
      // typescript check fix
      return
    }

    request.protocol = "http:"
    request.headers["x-request-id"] = reqId

    const app = this.appStore.app

    if (!app.source) {
      response.writeHead(400)
      response.end("app has no source")
      return
    }

    try {
      await this.runtime.setApp(app)
    } catch (err) {
      handleCriticalError(err, request, response)
      return
    }

    try {
      await handleRequest(this.runtime, request, response)
    } catch (err) {
      log.error("error handling request:", err.stack)
      handleCriticalError(err, request, response)
    } finally {
      const end = process.hrtime(start)
      this.runtime.log(
        "info",
        `${request.connection.remoteAddress} ${request.method} ${request.url} ${
          response.statusCode
        } ${((end[0] * 1e9 + end[1]) / 1e6).toFixed(2)}ms`
      )
    }
  }
}

type V8ResponseBody = null | string | number | ArrayBuffer | Buffer

export function handleRequest(
  rt: Runtime,
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<number> {
  const flyRecurseHeader = req.headers["fly-allow-recursion"]
  if (!flyRecurseHeader || !flyRecurseHeader[0]) {
    const flyAppHeader = req.headers["fly-app"]
    if (flyAppHeader) {
      const flyAppName: string = Array.isArray(flyAppHeader) ? flyAppHeader[0] : flyAppHeader
      if (flyAppName == rt.app.name) {
        res.writeHead(400)
        res.end("Too much recursion")
        req.destroy() // stop everything I guess.
        return Promise.resolve(0)
      }
    }
  }

  const fullURL = httpUtils.fullURL(req.protocol, req)

  let cbCalled = false
  return new Promise((resolve, reject) => {
    // mainly to make try...finally work
    let reqForV8 = {
      method: req.method,
      headers: req.headers,
      remoteAddr: req.connection.remoteAddress
    }

    let fetchCallback = (err: any, v8res: any, resBody: V8ResponseBody) => {
      if (cbCalled) {
        return // this can't happen twice
      }
      cbCalled = true

      if (err) {
        log.error("error from fetch callback:", err)

        writeHead(rt, res, 500)
        res.end("Error: " + err)
        return reject(err)
      }

      for (let n in v8res.headers) {
        try {
          n = n.trim()
          if (/^server$/i.test(n)) continue

          const val = v8res.headers[n]

          res.setHeader(n, val)
        } catch (err) {
          log.error("error setting header", err)
        }
      }

      for (let n of hopHeaders) res.removeHeader(n)

      let dst: Writable = res
      let contentEncoding = res.getHeader("content-encoding")
      let contentType = res.getHeader("content-type")
      let acceptEncoding = req.headers["accept-encoding"]
      if (acceptEncoding && acceptEncoding instanceof Array) {
        acceptEncoding = acceptEncoding.join(", ")
      }

      // gzip if no encoding
      if (!contentEncoding && contentType && acceptEncoding && acceptEncoding.includes("gzip")) {
        if (contentType && contentType instanceof Array) {
          contentType = contentType.join(", ")
        } else {
          contentType = contentType.toString()
        }
        // only gzip text
        if (
          contentType.includes("text/") ||
          contentType.includes("application/javascript") ||
          contentType.includes("application/x-javascript") ||
          contentType.includes("application/json")
        ) {
          res.removeHeader("Content-Length")
          res.setHeader("Content-Encoding", "gzip")
          dst = zlib.createGzip({ level: 2 })
          dst.pipe(res)
        }
      }

      writeHead(rt, res, v8res.status)

      handleResponse(rt, resBody, res, dst)
        .then(len => {
          rt.reportUsage("http", { data_out: len })
          if (!res.finished) res.end() // we are done. triggers 'finish' event
          resolve(len)
        })
        .catch(reject)
    }

    rt.get("fireFetchEvent")
      .then(fn => {
        fn.apply(null, [
          fullURL,
          new ivm.ExternalCopy(reqForV8).copyInto({ release: true }),
          req.method === "GET" || req.method === "HEAD" ? null : streamManager.add(rt, req),
          new ivm.Reference(fetchCallback)
        ]).catch(reject)
      })
      .catch(reject)
  })
}

function handleResponse(
  rt: Runtime,
  src: V8ResponseBody,
  res: http.ServerResponse,
  dst: Writable
): Promise<number> {
  if (!src) return Promise.resolve(0)

  if (typeof src == "number") {
    return handleResponseStream(rt, src, res, dst)
  }

  let totalLength = 0

  if (src instanceof ArrayBuffer) src = Buffer.from(src)

  return new Promise<number>((resolve, reject) => {
    res.on("finish", () => {
      if (src instanceof Buffer) totalLength = src.byteLength
      else if (typeof src === "string") totalLength = Buffer.byteLength(src, "utf8")
      resolve(totalLength)
    })
    res.on("error", err => {
      reject(err)
    })
    dst.end(src) // string or Buffer
  })
}

function handleResponseStream(
  rt: Runtime,
  streamId: number,
  res: http.ServerResponse,
  dst: Writable
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    setImmediate(() => {
      let dataOut = 0
      dst.on("data", function(d) {
        dataOut += d.byteLength
      })
      res
        .on("finish", function() {
          resolve(dataOut)
        })
        .on("error", reject)

      try {
        streamManager.pipe(
          rt,
          streamId,
          dst
        )
      } catch (e) {
        reject(e)
      }
    })
  })
}

function handleCriticalError(err: Error, req: http.IncomingMessage, res: http.ServerResponse) {
  log.error("critical error:", err)
  if (res.finished) return
  res.writeHead(500)
  res.end("Critical error.")
  req.destroy() // stop everything I guess.
}

function writeHead(rt: Runtime, res: http.ServerResponse, status: number) {
  res.writeHead(status)
}
