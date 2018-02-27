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
        return new ReadableStream({
          start(controller) {
            dispatcher.dispatch("readProxyStream",
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
                } else
                  logger.debug("unhandled event", name)
              })
            )
          },
          cancel() {
            logger.debug("readable stream was cancelled")
          }
        }) 
      }
    }
  }
}