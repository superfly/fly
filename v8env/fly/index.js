import flyCacheInit from './cache'
import flyLogInit from './log'

/**
 * @namespace fly
 */
export default function flyInit() {
  return {
    cache: flyCacheInit(),
    http: require('./http'),
    log: flyLogInit(),
    Image: require("@fly/image").Image,
  }
}
