/**
 * @module fetch
 */
import { logger } from "./logger"
import refToStream, { isFlyStream } from "./fly/streams"

/** @ignore */
declare var bridge: any

/**
 * Fly Request options, includes Fly specific params
 */
export interface FlyRequestInit extends RequestInit {
  /** Timeout before request is canceled */
  timeout?: number

  /** Read timeout on underlyig socket */
  readTimeout?: number
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
        readTimeout: (init && init.readTimeout) || 30 * 1000
      }
      if (!req.bodySource) { bridge.dispatch("fetch", url, init, null, fetchCb) }
      else if (typeof req.bodySource === "string") {
        bridge.dispatch("fetch", url, init, req.bodySource, fetchCb)
      }
      else {
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
      if (err) { return reject(new Error(err)) }
      resolve(new Response(isFlyStream(nodeBody) ? refToStream(nodeBody) : nodeBody, nodeRes))
    }
  })
}

/**
 * Error thrown when a fetch times out
 */
export class TimeoutError extends Error { }
