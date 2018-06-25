import { registerBridge } from './'

import { ivm } from '../'
import log from "../log"
import * as http from 'http'
import * as https from 'https'
import { parse as parseURL } from 'url'
import { ProxyStream } from './proxy_stream'

import { Bridge } from './bridge';
import { Runtime } from '../runtime';


const fetchAgent = new http.Agent({ keepAlive: true });
const fetchHttpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false })

registerBridge('fetch', function fetchBridge(rt: Runtime, bridge: Bridge, urlStr: string, init: any, body: ArrayBuffer | null | string, cb: ivm.Reference<Function>) {
  log.debug("native fetch with url:", urlStr)
  init || (init = {})
  const u = parseURL(urlStr)

  if (u.protocol === 'file:') {
    if (!bridge.fileStore) {
      cb.applyIgnored(null, ["no file store configured, should not happen!"])
      return
    }

    if (init.method && init.method != 'GET') {
      cb.applyIgnored(null, ["only GET allowed on file:// URIs"])
      return
    }

    try {
      bridge.fileStore.createReadStream(urlStr.replace("file://", "")).then((stream) => {
        stream.pause()
        cb.applyIgnored(null, [null,
          new ivm.ExternalCopy({
            status: 200,
            statusText: "OK",
            ok: true,
            url: urlStr,
            headers: {}
          }).copyInto({ release: true }),
          new ProxyStream(stream).ref
        ])
      }).catch((err) => {
        cb.applyIgnored(null, [err.toString()])
      })
    } catch (e) {
      // Might throw FileNotFound
      cb.applyIgnored(null, [e.toString()])
    }
    return
  }

  const httpFn = u.protocol == 'http:' ? http.request : https.request
  const httpAgent = u.protocol == 'http:' ? fetchAgent : fetchHttpsAgent

  let method = init.method || "GET"
  let headers = init.headers || {}

  let req: http.ClientRequest;

  let path = u.pathname
  if (u.query != null) {
    path = path + "?" + u.query
  }
  const reqOptions: https.RequestOptions = {
    agent: httpAgent,
    protocol: u.protocol,
    path: path,
    hostname: u.hostname,
    host: u.host,
    port: u.port,
    method: method,
    headers: headers,
    timeout: 60 * 1000
  }
  if (httpFn == https.request) {
    reqOptions.servername = reqOptions.hostname
  }
  req = httpFn(reqOptions)

  req.setHeader('fly-app', rt.app.name)

  req.once("response", handleResponse)

  req.on("error", handleError)

  setImmediate(function () {
    if (body)
      rt.reportUsage("fetch", {
        dataOut: Buffer.byteLength(body),
        method: method,
        host: u.host,
        path: u.path
      })
    if (body instanceof ArrayBuffer) {
      req.end(Buffer.from(body))
    } else {
      req.end(!!body ? body : null)
    }
  })

  return

  function handleResponse(res: http.IncomingMessage) {
    req.removeListener('response', handleResponse)
    req.removeListener('error', handleError)
    try {
      res.pause()

      cb.applyIgnored(null, [
        null,
        new ivm.ExternalCopy({
          status: res.statusCode,
          statusText: res.statusMessage,
          ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 400,
          url: urlStr,
          headers: res.headers
        }).copyInto({ release: true }),
        res.method === 'GET' || res.method === 'HEAD' ? null : new ProxyStream(res).ref
      ])

    } catch (err) {
      log.error("caught error", err)
      cb.applyIgnored(null, [err.toString()])
    }
  }

  function handleError(err: Error) {
    log.error("error requesting http resource", err)
    cb.applyIgnored(null, [err.toString()])
    req.removeListener('response', handleResponse)
    req.removeListener('error', handleError)
  }
})