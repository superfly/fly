import { log } from './log'

/**
 * @namespace fly
 */
export default function flyInit() {
  return {
    cache: deprecatedProxy(
      require("@fly/cache"),
      "fly.cache is deprecated and will be removed soon. Please use `import cache from '@fly/cache'` instead"
    ),
    http: require('./http'),
    log: log,
    Image: deprecatedProxy(
      require("@fly/image").Image,
      "fly.Image is deprecated and will be removed soon. Please use `import { Image } from '@fly/image'` instead",
    )
  }
}

function deprecatedProxy(obj, message) {
  return new Proxy(obj, {
    get: function (receiver, name) {
      console.warn(message)
      return receiver[name]
    }
  })
}
