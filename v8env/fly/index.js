import flyCacheInit from './cache'
import flyLogInit from './log'
import SparkMD5 from 'spark-md5'
import initStreams from './streams'
import initImage from '../ts/fly/image.ts' 

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
    },
    streams: initStreams(ivm, dispatcher),
    Image: initImage(ivm, dispatcher) 
  }
}