import flyCacheInit from './cache'
import flyLogInit from './log'
import SparkMD5 from 'spark-md5'

/**
 * @namespace fly
 */
export default function flyInit(ivm, dispatcher) {
  return {
    cache: flyCacheInit(ivm, dispatcher),
    http: require('./http'),
    log: flyLogInit(ivm, dispatcher),
    util: {
      md5: {
        hash: SparkMD5.hash
      },
      refToStream: function(ref){
        let closed = false
        let resumed = false
        const r = new ReadableStream({
          start(controller) {
            dispatcher.dispatch("subscribeProxyStream",
              ref,
              new ivm.Reference((name, ...args) => {
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
          pull(controller){
            //if(r.locked && !resumed){
              if(closed){
                return Promise.resolve(null)
              }
              return new Promise((resolve, reject) => {
                resumed = true
                dispatcher.dispatch("readProxyStream", ref, new ivm.Reference((err, data) => {
                  if(err){
                    controller.error(new Error(err))
                    reject(err)
                    return
                  }
                  // if data is blank the stream will keep pulling
                  // readProxyStream tries a few times to minimize bridge calls
                  controller.enqueue(data)
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
}