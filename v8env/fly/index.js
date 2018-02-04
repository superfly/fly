import flyCacheInit from './cache'

/**
 * @namespace fly
 */
export default function flyInit(ivm, dispatch) {
  return {
    cache: flyCacheInit(ivm, dispatch),
    http: require('./http')
  }
}