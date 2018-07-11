import { registerBridge } from './'

import { ivm } from '../'
import log from "../log"
import * as http from 'http'
import * as https from 'https'
import { parse as parseURL } from 'url'

import { Bridge } from './bridge';
import { Runtime } from '../runtime';
import { streamManager } from '../stream_manager';

const fetchAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 5 * 1000,
  maxSockets: 1024 * 10 // seems sensible
});
const fetchHttpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 5 * 1000,
  rejectUnauthorized: false, // for simplicity
  maxSockets: 1024 * 10 // seems sensible
})

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
      bridge.fileStore.createReadStream(rt, urlStr.replace("file://", "")).then((stream) => {
        const id = streamManager.add(rt, stream)
        cb.applyIgnored(null, [null,
          new ivm.ExternalCopy({
            status: 200,
            statusText: "OK",
            ok: true,
            url: urlStr,
            headers: {}
          }).copyInto({ release: true }),
          id
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
  req.setNoDelay(true)

  req.setHeader('fly-app', rt.app.name)

  req.on("error", handleError)
  req.once("response", handleResponse)

  const start = process.hrtime()
  const dataOut = body ? Buffer.byteLength(body) : 0

  setImmediate(function () {
    if (body instanceof ArrayBuffer) {
      req.end(Buffer.from(body))
    } else {
      req.end(!!body ? body : null)
    }
  })

  return

  function handleResponse(res: http.IncomingMessage) {
    rt.reportUsage("fetch", {
      data_out: dataOut,
      method: method,
      host: u.host,
      path: u.path,
      remote_addr: res.socket.remoteAddress,
      status: res.statusCode,
      response_time: process.hrtime(start)
    })

    req.removeListener('response', handleResponse)
    req.removeListener('error', handleError)

    const retInit = new ivm.ExternalCopy({
      status: res.statusCode,
      statusText: res.statusMessage,
      ok: res.statusCode && res.statusCode >= 200 && res.statusCode < 400,
      url: urlStr,
      headers: res.headers
    }).copyInto({ release: true })

    if (res.method === 'GET' || res.method === 'HEAD') {
      return cb.applyIgnored(null, [null, retInit])
    }

    cb.applyIgnored(null, [null, retInit, streamManager.add(rt, res, { readTimeout: init.readTimeout })])
  }

  function handleError(err: Error) {
    log.error("error requesting http resource", err)
    cb.applyIgnored(null, [err.toString()])
    req.removeListener('response', handleResponse)
    req.removeListener('error', handleError)
  }
})