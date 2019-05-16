/**
 * @module fly
 * @private
 */
import { logger } from "../logger"
import { ReadableStream } from "../streams"

declare var bridge: any

export type FlyStreamId = number

/**
 * @hidden
 */
export function isFlyStream(arg: any) {
  if (typeof arg !== "object" || arg === null) {
    return false
  }

  return isFlyStreamId(arg.flyStreamId)
}

export function isFlyStreamId(arg: any): arg is FlyStreamId {
  return typeof arg === "number"
}

export function makeFlyStream(): FlyStreamId {
  const id = bridge.dispatchSync("stream.create")
  if (typeof id === "number") {
    return id as FlyStreamId
  }
  throw new Error("Failed to get stream ID")
}

export function writeToFlyStream(id: FlyStreamId, chunk: any) {
  return bridge.dispatchSync("stream.push", id, chunk)
}

export function endFlyStream(id: FlyStreamId, chunk: any) {
  return bridge.dispatchSync("stream.end", id, chunk)
}

/**
 * @hidden
 */
export default function refToStream(ref: any) {
  if (isFlyStream(ref)) {
    return ref
  }

  if (!isFlyStreamId(ref)) {
    throw new Error(`ref is not a fly stream id: {ref}`)
  }

  let closed = false
  const r = new ReadableStream(
    {
      start(controller) {
        const cb = bridge.wrapFunction(
          function streamSubscribe(name, ...args) {
            logger.debug("stream event:", name)
            if (name === "close" || name === "end") {
              try {
                cb.release()
              } catch (e) {
                // ignore
              }
              if (!closed) {
                closed = true
                controller.close()
              }
            } else if (name === "error") {
              try {
                cb.release()
              } catch (e) {
                // ignore
              }
              logger.error("error in stream:", args[0])
              controller.error(new Error(args[0]))
            } else {
              logger.error("unhandled event", name)
            }
          },
          { release: false }
        )
        bridge.dispatch("streamSubscribe", ref, cb) // no releasing here, we re-use it
      },
      pull(controller) {
        if (closed) {
          return Promise.resolve(null)
        }
        return new Promise(function pullPromise(resolve, reject) {
          bridge.dispatch("streamRead", ref, function streamRead(err, data) {
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
        logger.info(`stream ${ref} was cancelled`)
      }
    },
    {
      highWaterMark: 0
    }
  )
  r.flyStreamId = ref

  return new Proxy(r, {
    get: (target, propKey, receiver) => {
      if (propKey === "refTee") {
        return () => {
          const [s1, s2] = bridge.dispatchSync("streamTee", ref)
          return [refToStream(s1), refToStream(s2)]
        }
      } else {
        return target[propKey]
      }
    }
  })
}
