/**
 * @module fly
 * @private
 */
import { logger } from "./logger"
import { EventEmitter2 as EventEmitter } from "eventemitter2"
import refToStream, { isFlyStream, makeFlyStream, writeToFlyStream, endFlyStream } from "./fly/streams"

declare var bridge: any

const invalidResponseType = new Error(
  `Invalid response type for 'fetch' event. Expecting a straight Response, a function returning a Promise<Response> or a Response.`
)

/**
 * The fetch event fires when your app receives an HTTP request
 * @hidden
 * @event #fetch
 * @type {FetchEvent}
 * @property {FetchEvent} event
 */

/**
 * @hidden
 */
export class FetchEvent {
  public type: any
  public request: any
  public callback: any
  public respondWithEntered: boolean

  constructor(type, init, callback) {
    this.type = type
    this.request = init.request
    if (!this.request) {
      throw new Error("init.request is required.")
    }
    this.callback = callback
    this.respondWithEntered = false
  }

  /**
   * respondWith callback
   * @callback respondWithCallback
   * @param {Response} The HTTP response to reply with
   */
  /**
   * Registers a function to generate a response for this event
   * @param {respondWithCallback} fn
   */
  public respondWith(fn) {
    this.respondWithEntered = true
    try {
      let ret = fn
      if (typeof ret === "function") {
        ret = fn()
      }
      if (ret instanceof Promise) {
        ret
          .then(res => {
            if (res instanceof Response) {
              return this.callback(null, res)
            }
            logger.debug("weird response:", res ? res.constructor : undefined)
            this.callback(invalidResponseType)
          })
          .catch(err => {
            this.callback(err)
          })
      } else if (ret instanceof Response) {
        this.callback(null, ret)
      } else {
        this.callback(invalidResponseType)
      }
    } catch (err) {
      this.callback(err)
    }
  }
}

/**
 * @hidden
 */
export const emitter = new EventEmitter()

/**
 * @hidden
 */
export function addEventListener(name, fn) {
  emitter.addListener(name, fn)
}

/**
 * @hidden
 */
export function fireFetchEvent(url, req, body, callback) {
  logger.debug("handling request event")
  const selfCleaningCallback = (...args) => {
    callback.apply(null, args)
    try {
      callback.release()
    } catch (e) {
      // ignore
    }
    if (body) {
      try {
        body.release()
      } catch (e) {
        // ignore
      }
    }
  }

  const fetchEvent = new FetchEvent(
    "fetch",
    {
      request: new Request(
        url,
        Object.assign(req, {
          body: (body && refToStream(body)) || null
        })
      )
    },
    async function fetchEventCallback(err, res) {
      logger.debug("request event callback called", typeof err, typeof res, res instanceof Response)

      if (err) {
        logger.error(err, err.stack)
        return selfCleaningCallback.apply(null, [err.toString()])
      }

      if (res.bodyUsed) {
        return selfCleaningCallback.apply(null, [new Error("Body has already been used").toString()])
      }

      let b = null
      let streamID: number | undefined

      if (isFlyStream(res.body)) {
        b = res.body.flyStreamId
      } else if (res.bodySource instanceof ReadableStream) {
        // get response id
        b = streamID = makeFlyStream()
        // streaming happens below, we just need an ID to send to the bridge
      } else {
        logger.debug("body source type:", res.bodySource.constructor.name)
        if (typeof res.bodySource === "string") {
          b = res.bodySource
        } else {
          b = bridge.wrapValue(await res.arrayBuffer())
        }
      }

      logger.debug("got ourselves a body")

      selfCleaningCallback.apply(undefined, [
        null,
        bridge.wrapValue({
          headers: (res.headers && res.headers.toJSON()) || {},
          status: res.status
        }),
        b
      ])

      // if body is a stream, send it over
      if (streamID) {
        // stream to bridge
        logger.debug("sending stream response")
        const stream: ReadableStream = res.bodySource
        const reader = stream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (!done && value) {
              writeToFlyStream(streamID, value)
            } else if (done) {
              //pushToFlyStream(streamID, null)
              endFlyStream(streamID, value)
              break
            }
          }
        } finally {
          try {
            // Might throw if the reader is still locked because we finished
            // successfully without breaking or throwing.
            await stream.cancel()
          } catch {}
        }
      }
    }
  )
  const fn = emitter.listeners("fetch").slice(-1)[0]
  if (typeof fn !== "function") {
    return selfCleaningCallback.apply(null, [
      "No HTTP handler attached: make sure your app calls `fly.http.respondWith(...)."
    ])
  }

  if ((fn(fetchEvent) as any) instanceof Promise) {
    return selfCleaningCallback.apply(null, ["'fetch' event handler function cannot return a promise."])
  }

  if (!fetchEvent.respondWithEntered) {
    return selfCleaningCallback.apply(null, ["respondWith was not called for FetchEvent"])
  }
}

/**
 * @hidden
 */
export function dispatchEvent(event) {
  emitter.emit(event.type, event)
}
