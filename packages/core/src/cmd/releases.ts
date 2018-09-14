import { root, getAppName, CommonOptions, addCommonOptions } from './root'
import { apiClient } from './api'
import { processResponse } from '../utils/cli'
import { Command } from 'commandpost';

export interface ReleasesOptions extends CommonOptions { }
export interface ReleasesArgs { }

export const releases = root
  .subCommand<ReleasesOptions, ReleasesArgs>("releases")
  .description("Manage Fly apps.")
  .action(async function (this: Command<ReleasesOptions, ReleasesArgs>, opts, args, rest) {
    const API = apiClient(this)
    try {
      const appName = getAppName(this)
      const res = await API.get(`/api/v1/apps/${appName}/releases`)
      processResponse(res, (res: any) => {
        if (res.data.data.length == 0)
          return console.log(`No releases for ${appName} yet.`)
        for (let r of res.data.data) {
          console.log(`v${r.attributes.version} ${r.attributes.reason} by ${r.attributes.author} on ${r.attributes.created_at}`)
        }
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  })

addCommonOptions(releases)