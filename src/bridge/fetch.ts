import { registerBridge } from './'

import { ivm, Context } from '../'
import log from "../log"
import * as http from 'http'
import * as https from 'https'
import { URL, parse as parseURL, format as formatURL } from 'url'
import { fullURL } from '../utils/http'
import { transferInto } from '../utils/buffer'
import { ProxyStream } from './proxy_stream'

import { Trace } from '../trace'
import { FileNotFound } from '../file_store';
import { Bridge } from './bridge';
import { Releasable } from '../context';


const fetchAgent = new http.Agent({ keepAlive: true });
const fetchHttpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false })

registerBridge('fetch', function fetchBridge(ctx: Context, bridge: Bridge, urlStr: string, init: any, body: ArrayBuffer | null | string, refCb: ivm.Reference<Function>) {
  log.debug("native fetch with url:", urlStr)
  log.silly("fetch init: ", JSON.stringify(init))
  let t = Trace.tryStart('fetch', ctx.trace)
  let dataIn = 0,
    dataOut = 0
  const cb = new ReferenceWrapper(refCb, function () {
    t.end({ dataIn, dataOut })
  })
  ctx.addCallback(cb)
  init || (init = {})
  const u = parseURL(urlStr)

  if (u.protocol === 'file:') {
    if (!ctx.meta.app) {
      ctx.tryCallback(cb, ["no app configured, should not happen!"])
      return
    }
    if (!bridge.fileStore) {
      ctx.tryCallback(cb, ["no file store configured, should not happen!"])
      return
    }

    if (init.method && init.method != 'GET') {
      ctx.tryCallback(cb, ["only GET allowed on file:// URIs"])
      return
    }

    try {
      bridge.fileStore.createReadStream(urlStr.replace("file://", "")).then((stream) => {
        stream.pause()
        ctx.applyCallback(cb, [null,
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
        ctx.tryCallback(cb, [err.toString()])
      })
    } catch (e) {
      // Might throw FileNotFound
      ctx.tryCallback(cb, [e.toString()])
    }
    return
  }

  let depth = ctx.meta.flyDepth || 0

  log.silly("fetch depth: ", depth)
  if (depth >= 3) {
    log.error("too much recursion: ", depth)
    ctx.tryCallback(cb, ["Too much recursion"])
    return
  }

  if (!u.host)
    u.host = ctx.meta.originalHost
  if (!u.protocol)
    u.protocol = ctx.meta.originalScheme

  const httpFn = u.protocol == 'http:' ? http.request : https.request
  const httpAgent = u.protocol == 'http:' ? fetchAgent : fetchHttpsAgent

  let method = init.method || "GET"
  let headers = Object.assign({},
    // defaults
    {
      origin: `${ctx.meta.originalScheme}//${ctx.meta.originalHost}`
    },
    // user-supplied
    init.headers || {},
    // override
    {
      'x-fly-depth': (depth + 1).toString()
    }
  )

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

  req.once("response", handleResponse)

  req.on("error", handleError)

  setImmediate(function () {
    if (body)
      dataOut += Buffer.byteLength(body, 'utf-8')
    if (body instanceof ArrayBuffer) {
      req.end(Buffer.from(body))
    } else {
      req.end(!!body ? body : null)
    }
  })

  return refCb

  function handleResponse(res: http.IncomingMessage) {
    log.silly(`Fetch response: ${res.statusCode} ${urlStr} ${JSON.stringify(res.headers)}`)
    req.removeListener('response', handleResponse)
    req.removeListener('error', handleError)
    try {
      res.pause()

      ctx.applyCallback(cb, [
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
      ctx.tryCallback(cb, [err.toString()])
    }
  }

  function handleError(err: Error) {
    log.error("error requesting http resource", err)
    ctx.tryCallback(cb, [err.toString()])
    req.removeListener('response', handleResponse)
    req.removeListener('error', handleError)
  }
})



class ReferenceWrapper {
  fn: ivm.Reference<Function>
  cb: Function
  constructor(fn: ivm.Reference<Function>, cb: Function) {
    this.fn = fn
    this.cb = cb
  }
  release() {
    return this.fn.release()
  }
  apply(...args: any[]) {
    try {
      return this.fn.apply(...args)
    } finally {
      this.cb()
    }
  }
}
