import { logger } from '../logger'

export default function refToStream(ref) {
  let closed = false
  const r = new ReadableStream({
    start(controller) {
      const cb = bridge.wrapFunction(function (name, ...args) {
        logger.debug("GOT EVENT:", name)
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
          logger.debug("unhandled event", name)
      }, { release: false }) // don't necessarily want to release
      bridge.dispatch("subscribeProxyStream", ref, cb)
      // dispatcher.dispatch("subscribeProxyStream",
      //   ref,
      //   cb
      // ).catch((err) => {
      //   try { cb.release() } catch (e) { }
      //   controller.error(err)
      // })
    },
    pull(controller) {
      //if(r.locked && !resumed){
      if (closed) {
        return Promise.resolve(null)
      }
      return new Promise((resolve, reject) => {
        bridge.dispatch("readProxyStream", ref, (err, data, tainted) => {
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
            try { r._ref.release() } catch (e) { }
            r._ref = undefined
          }
          resolve()
        })

        // const cb = new ivm.Reference((err, data, tainted) => {
        //   cb.release()
        //   if (err) {
        //     controller.error(new Error(err))
        //     reject(err)
        //     return
        //   }
        //   // if data is blank the stream will keep pulling
        //   // readProxyStream tries a few times to minimize bridge calls
        //   controller.enqueue(data)
        //   if (data && r._ref && tainted) {
        //     // once underlying ref is tainted, we can't pass it around anymore
        //     // but we can still use it internally
        //     try { r._ref.release() } catch (e) { }
        //     r._ref = undefined
        //   }
        //   resolve()
        // })



        // dispatcher.dispatch("readProxyStream", ref, cb).catch((err) => {
        //   try { cb.release() } catch (e) { }
        //   controller.error(err)
        // })

      })
      //}
    },
    cancel() {
      try { r._ref.release() } catch (e) { }
      logger.debug("readable stream was cancelled")
    }
  })
  r._ref = ref
  return r
}