import flyCacheInit from './cache'
import flyLogInit from './log'
import initStreams from './streams'
import initImage from '../ts/fly/image.ts'
import initFont from '../ts/fly/font.ts'
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
    Font: initFont(ivm, dispatcher),
    //Document,
    //Element
  }
}
