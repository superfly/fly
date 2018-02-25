import { logger } from '../logger'

export default function dispatcherInit(ivm, dispatch) {
  return {
    dispatch(name, ...args) {
      logger.debug("dispatching", name)
      for (const arg of args)
        if (arg instanceof ivm.Reference)
          global.releasables.push(arg)
        else if (arg instanceof ivm.ExternalCopy)
          global.releasables.push(arg)

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