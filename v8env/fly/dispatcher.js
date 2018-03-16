import { logger } from '../logger'

export default function dispatcherInit(ivm, dispatch) {
  releasables.push(dispatch)
  return {
    dispatch(name, ...args) {
      logger.debug("dispatching", name)
      for (const arg of args)
        if (arg && typeof arg.release === 'function')
          releasables.push(arg)

      dispatch.apply(null, [name, ...args])
        .then(() => {
          logger.debug("successfully dispatched function", name)
        })
        .catch((err) => {
          logger.error("error dispatching bridge function", name, err)
        })
    }
  }
}