import { registerBridge, Context } from './'

import { ivm } from '../'
import log from "../log"
import * as http from 'http'
import * as https from 'https'
import { URL, parse as parseURL, format as formatURL } from 'url'
import { headersForWeb, fullURL } from '../utils/http'

import { Trace } from '../trace'

const fetchAgent = new http.Agent({ keepAlive: true });
const fetchHttpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false })

const wormholeRegex = /^(wormhole\.)/

registerBridge('fetch', fetchBridge)

export function fetchBridge(ctx: Context) {
  return function (urlStr: string, init: any, body: ArrayBuffer, cb: ivm.Reference<Function>) {
    log.info("native fetch with url:", urlStr)
    let t = Trace.tryStart('fetch', ctx.trace)
    init || (init = {})
    const u = parseURL(urlStr)
    let depth = <number>ctx.meta.get('flyDepth')

    log.debug("fetch depth: ", depth)
    if (depth >= 3) {
      log.error("too much recursion: ", depth)
      cb.apply(undefined, ["Too much recursion"])
      return
    }

    if (!u.host)
      u.host = ctx.meta.get('originalHost')
    if (!u.protocol)
      u.protocol = ctx.meta.get('originalScheme')

    try {
      setImmediate(() => {
        const httpFn = u.protocol == 'http:' ? http.request : https.request
        const httpAgent = u.protocol == 'http:' ? fetchAgent : fetchHttpsAgent

        let method = init.method || "GET"
        let headers = init.headers || {}
        headers['X-Fly-Depth'] = (depth + 1).toString()
        let req: http.ClientRequest;

        let path = u.pathname
        if (u.query != null) {
          path = path + "?" + u.query
        }
        req = httpFn({
          agent: httpAgent,
          protocol: u.protocol,
          path: path,
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
                res.on("close", function () {
                  t.end()
                  callback.apply(undefined, ["close"])
                })
                res.on("end", function () {
                  t.end()
                  callback.apply(undefined, ["end"])
                })
                res.on("error", function (err: Error) {
                  t.end()
                  callback.apply(undefined, ["error", err.toString()])
                })

                res.on("data", function (data: Buffer) {
                  callback.apply(undefined, [
                    "data",
                    new ivm.ExternalCopy(bufferToArrayBuffer(data), {
                      transfer: true
                    }).copyInto({ transfer: true })
                  ])
                })
                res.resume()
                //callback.apply(undefined, ["end"])
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

        req.end(body && Buffer.from(body) || null)
      })
    } catch (err) {
      log.error("caught error", err)
      cb.apply(undefined, [err.toString()])
    }

    return
  }
}

function bufferToArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset, buffer.byteOffset + buffer.byteLength
  )
}