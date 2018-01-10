import { add } from './catalog'

import * as ivm from 'isolated-vm'
import log from "../log"
import * as http from 'http'
import * as https from 'https'
import { URL, parse as parseURL, format as formatURL } from 'url'
import { headersForWeb, fullURL } from '../utils/http'

import { conf } from '../config'

import { Trace } from '../trace'

const fetchAgent = new http.Agent({ keepAlive: true });
const fetchHttpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false })

const wormholeRegex = /^(wormhole\.)/

add('fetch', fetch)
export function fetch(context: any, urlStr: string, init: any, body: ArrayBuffer, cb: ivm.Reference<Function>) {
  log.info("native fetch with url:", urlStr)
  let t = Trace.start('native fetch')
  init || (init = {})
  const u = parseURL(urlStr)

  if (!u.host)
    u.host = context.originalHost
  if (!u.protocol)
    u.protocol = context.originalScheme

  try {
    setImmediate(() => {
      const httpFn = u.protocol == 'http:' ? http.request : https.request
      const httpAgent = u.protocol == 'http:' ? fetchAgent : fetchHttpsAgent

      let method = init.method || "GET"
      let headers = init.headers || {}
      let req: http.ClientRequest;

      req = httpFn({
        agent: httpAgent,
        protocol: u.protocol,
        path: u.pathname,
        hostname: u.hostname,
        host: u.host,
        port: u.port,
        method: method,
        headers: headers,
        timeout: 5000
      })

      req.on("response", function (res) {
        res.pause()
        cb.apply(undefined, [
          null,
          new ivm.ExternalCopy({
            status: res.statusCode,
            statusText: res.statusMessage,
            ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 400,
            url: urlStr,
            headers: res.headers
          }),
          new ivm.Reference(function (callback: ivm.Reference<Function>) {
            setImmediate(async () => {
              let readDone = false
              res.on("close", function () {
                readDone = true
                callback.apply(undefined, ["close"])
              })
              res.on("end", function () {
                readDone = true
                callback.apply(undefined, ["end"])
              })
              res.on("error", function (err: Error) {
                readDone = true
                callback.apply(undefined, ["error", err.toString()])
              })
              do {
                let data = res.read()
                if (!data)
                  break
                callback.apply(undefined, ["data", new ivm.ExternalCopy(bufferToArrayBuffer(data)).copyInto()])
              } while (!readDone)
              callback.apply(undefined, ["end"])
              t.end()
            })
          }),
          new ivm.Reference(res)
        ])
      })

      req.on("error", function (err) {
        log.error("error requesting http resource", err)
        cb.apply(undefined, [err.toString()])
      })

      log.warn("body is", typeof body, body instanceof ArrayBuffer)

      req.end(Buffer.from(body), () => { log.debug("ENDED!", arguments) })
    })
  } catch (err) {
    log.error("caught error", err)
    cb.apply(undefined, [err.toString()])
  }

  return
}

function bufferToArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset, buffer.byteOffset + buffer.byteLength
  )
}