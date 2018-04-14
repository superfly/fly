import flyCacheInit from './cache'
import flyLogInit from './log'
import initStreams from './streams'
import initImage from '../ts/fly/image.ts'
import initCSS from '../ts/fly/css.ts'
import { Document, Element } from '../document'


/**
 * @namespace fly
 */
export default function flyInit(ivm, dispatcher) {
  return {
    cache: flyCacheInit(ivm, dispatcher),
    http: require('./http'),
    log: flyLogInit(ivm, dispatcher),
    streams: initStreams(ivm, dispatcher),
		Image: initImage(ivm, dispatcher),
		CSS: initCSS(ivm, dispatcher),
    //Document,
    //Element
  }
}
