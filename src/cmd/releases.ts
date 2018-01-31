import { root, getApp } from './root'
import { API } from './api'

export interface ReleasesOptions { }
export interface ReleasesArgs { }

root
  .subCommand<ReleasesOptions, ReleasesArgs>("releases")
  .description("Manage Fly apps.")
  .action(async (opts, args, rest) => {
    const appID = getApp()
    const res = await API.get(`/api/v1/apps/${appID}/releases`)
    if (res.status === 200) {
      if (res.data.data.length == 0)
        return console.log(`No releases for ${appID} yet.`)
      for (let r of res.data.data) {
        console.log(`v${r.attributes.version} ${r.attributes.reason} by ${r.attributes.author} on ${r.attributes.created_at}`)
      }
    }
  })