import { root, getAppName, CommonOptions, addCommonOptions } from './root'
import { apiClient } from './api'
import { processResponse } from '../utils/cli'
import { Command } from 'commandpost';

export interface FetchOptions extends CommonOptions { }
export interface FetchArgs { }

const fetch = root
  .subCommand<FetchOptions, FetchArgs>("fetch")
  .description("Fetch your Fly app locally.")
  .action(async function (this: Command<FetchOptions, FetchArgs>, opts, args, rest) {
    const API = apiClient(this)
    try {
      const appName = getAppName(this)
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

addCommonOptions(fetch)