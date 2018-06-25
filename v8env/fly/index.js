import flyCache from './cache'
import { log } from './log'

/**
 * @namespace fly
 */
export default function flyInit() {
  return {
    cache: flyCache,
    http: require('./http'),
    log: log,
    Image: require("@fly/image").Image,
  }
}
