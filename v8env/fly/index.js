import flyCacheInit from './cache'
import SparkMD5 from 'spark-md5'

/**
 * @namespace fly
 */
export default function flyInit(ivm, dispatch) {
  return {
    cache: flyCacheInit(ivm, dispatch),
    http: require('./http'),
    util: {
      md5: {
        hash: SparkMD5.hash
      }
    }
  }
}