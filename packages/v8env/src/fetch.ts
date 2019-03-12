/**
 * @module fetch
 */
import { logger } from "./logger"
import refToStream, { isFlyStream, isFlyStreamId } from "./fly/streams"

declare var bridge: any

export interface FlyRequestInit extends RequestInit {
  timeout?: number
  readTimeout?: number
  certificate?: {
    key: string | Buffer
    cert: string | Buffer
    ca?: Array<string | Buffer>
  }
}

/**
 * Starts the process of fetching a network request.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
 * @global
 * @param req - The direct URL or Request for the resource you wish to fetch
 * @param init - Options for the request
 * @return A Promise that resolves to a {@linkcode Response} object
 */
export function fetch(req: RequestInfo, init?: FlyRequestInit): Promise<Response> {
  logger.debug("fetch called", typeof req, typeof init)
  return new Promise(function fetchPromise(resolve, reject) {
    try {
      if (typeof req === "string") {
        req = new Request(req, init)
      }
      const url = req.url
      init = {
        method: req.method,
        headers: (req.headers && req.headers.toJSON()) || {},
        timeout: init && init.timeout,
        readTimeout: (init && init.readTimeout) || 30 * 1000,
        certificate: init && init.certificate
      }
      if (!req.bodySource) {
        bridge.dispatch("fetch", url, init, null, fetchCb)
      } else if (typeof req.bodySource === "string") {
        bridge.dispatch("fetch", url, init, req.bodySource, fetchCb)
      } else if (isFlyStream(req.bodySource)) {
        bridge.dispatch("fetch", url, init, req.bodySource.flyStreamId, fetchCb)
      } else {
        req
          .arrayBuffer()
          .then(function fetchArrayBufferPromise(body) {
            bridge.dispatch("fetch", url, init, body, fetchCb)
          })
          .catch(reject)
      }
    } catch (err) {
      logger.debug("err applying nativeFetch", err.toString())
      reject(err)
    }
    function fetchCb(err, nodeRes, nodeBody) {
      if (err && typeof err === "string" && err.includes("timeout")) {
        return reject(new TimeoutError(err))
      }
      if (err) {
        return reject(new Error(err))
      }

      if (isFlyStream(nodeBody) || isFlyStreamId(nodeBody)) {
        nodeBody = refToStream(nodeBody)
      }

      resolve(new Response(nodeBody, nodeRes))
    }
  })
}

export class TimeoutError extends Error {}
