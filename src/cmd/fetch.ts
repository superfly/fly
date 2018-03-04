import { root, getAppName } from './root'
import { API } from './api'
import { processResponse } from '../utils/cli'

export interface FetchOptions { }
export interface FetchArgs { }

root
  .subCommand<FetchOptions, FetchArgs>("fetch")
  .description("Fetch your Fly app locally.")
  .action(async (opts, args, rest) => {
    try {
      const appName = getAppName()
      const res = await API.get(`/api/v1/apps/${appName}/source`)
      processResponse(res, (res: any) => {
        console.log(res.data.data.attributes.source)
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  })