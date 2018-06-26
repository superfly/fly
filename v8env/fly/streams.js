import { logger } from '../logger'

export const streamIdPrefix = "__fly_stream_id:"
export function isFlyStream(id) {
  return typeof id === "string" && id.startsWith(streamIdPrefix)
}

export default function refToStream(id) {
  let closed = false
  id = id.replace(streamIdPrefix, "")
  const r = new ReadableStream({
    start(controller) {
      bridge.dispatch("streamSubscribe", id, bridge.wrapFunction(function (name, ...args) {
        logger.debug("GOT EVENT:", name)
        if (name === "close" || name === "end") {
          // try { cb.release() } catch (e) { }
          if (!closed) {
            closed = true
            controller.close()
          }
        } else if (name === "error") {
          logger.error("error in stream:", args[0])
          controller.error(new Error(args[0]))
          // } else if (name === "data") {
          //   controller.enqueue(args[0])
        } else
          logger.debug("unhandled event", name)
      }, { release: false })) // don't necessarily want to release)
    },
    pull(controller) {
      if (closed) {
        return Promise.resolve(null)
      }
      return new Promise((resolve, reject) => {
        bridge.dispatch("streamRead", id, (err, data) => {
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
      logger.debug("readable stream was cancelled")
    }
  }, {
      highWaterMark: 0
    })
  r.flyStreamId = id
  return r
}