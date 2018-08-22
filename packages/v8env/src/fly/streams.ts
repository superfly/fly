/**
 * @module fly
 * @private
 */
import { logger } from '../logger'
import { ReadableStream } from "../streams"

declare var bridge: any

/**
 * @hidden
 */
export function isFlyStream(id) {
  return typeof id === "number"
}

/**
 * @hidden
 */
export default function refToStream(id) {
  let closed = false
  const r = new ReadableStream({
    start(controller) {
      const cb = bridge.wrapFunction(function streamSubscribe(name, ...args) {
        logger.debug("stream event:", name)
        if (name === "close" || name === "end") {
          try { cb.release() } catch (e) { }
          if (!closed) {
            closed = true
            controller.close()
          }
        } else if (name === "error") {
          try { cb.release() } catch (e) { }
          logger.error("error in stream:", args[0])
          controller.error(new Error(args[0]))
        } else
          logger.error("unhandled event", name)
      }, { release: false })
      bridge.dispatch("streamSubscribe", id, cb) // no releasing here, we re-use it
    },
    pull(controller) {
      if (closed) {
        return Promise.resolve(null)
      }
      return new Promise(function pullPromise(resolve, reject) {
        bridge.dispatch("streamRead", id, function streamRead(err, data) {
          if (err) {
            controller.error(new Error(err))
            reject(err)
            return
          }
          controller.enqueue(data)
          resolve()
        })

      })
    },
    cancel() {
      logger.info(`stream ${id} was cancelled`)
    }
  }, {
      highWaterMark: 0
    })
  r.flyStreamId = id
  return r
}