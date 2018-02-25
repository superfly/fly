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
      }
    }
  }
}