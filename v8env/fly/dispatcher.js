import { logger } from '../logger'

export default function dispatcherInit(ivm, dispatch) {
  releasables.push(dispatch)
  return {
    dispatch(name, ...args) {
      logger.debug("dispatching", name)
      return dispatch.apply(null, [name, ...args])
      // .then((v) => {
      //   logger.debug("successfully dispatched function", name)
      //   return v
      // })
      // .catch((err) => {
      //   logger.error("error dispatching bridge function", name, err)
      // })
    },
    dispatchSync(name, ...args) {
      logger.debug("dispatching sync", name)
      return dispatch.applySyncPromise(null, [name, ...args])
    }
  }
}