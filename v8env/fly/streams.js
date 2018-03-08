import { logger } from '../logger'

export default function initStreams(ivm, dispatcher) {
  return {
    refToStream(ref) {
      let closed = false
      const r = new ReadableStream({
        start(controller) {
          dispatcher.dispatch("subscribeProxyStream",
            ref,
            new ivm.Reference(function (name, ...args) {
              logger.debug("GOT EVENT:", name)
              if (name === "close" || name === "end") {
                if (!closed) {
                  closed = true
                  controller.close()
                }
              } else if (name === "error") {
                controller.error(new Error(args[0]))
                /*} else if (name === "data") {
                  controller.enqueue(args[0])
                  if(controller.desiredSize <= 0 && resumed){
                    resumed = false
                    dispatcher.dispatch("controlProxyStream", "pause", ref)
                  }//*/ //not using events, calling read manually with pull for now
              } else
                logger.debug("unhandled event", name)
            })
          )
        },
        pull(controller) {
          //if(r.locked && !resumed){
          if (closed) {
            return Promise.resolve(null)
          }
          return new Promise((resolve, reject) => {
            dispatcher.dispatch("readProxyStream", ref, new ivm.Reference((err, data, tainted) => {
              if (err) {
                controller.error(new Error(err))
                reject(err)
                return
              }
              // if data is blank the stream will keep pulling
              // readProxyStream tries a few times to minimize bridge calls
              controller.enqueue(data)
              if (data && r._ref && tainted) {
                // once underlying ref is tainted, we can't pass it around anymore
                // but we can still use it internally
                r._ref = undefined
              }
              resolve()
            }))

          })
          //}
        },
        cancel() {
          logger.debug("readable stream was cancelled")
        }
      })
      r._ref = ref
      return r
    }
  }
}