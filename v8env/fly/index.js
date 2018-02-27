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
                } else if (name === "data") {
                  controller.enqueue(args[0])
                  if((!r.locked || controller.desiredSize <= 0) && resumed){
                    resumed = false
                    dispatcher.dispatch("controlProxyStream", "pause", ref)
                  }
                } else
                  logger.debug("unhandled event", name)
              })
            )
          },
          pull(){
            if(!resumed){
              resumed = true
              dispatcher.dispatch("controlProxyStream", "resume", ref)
            }
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