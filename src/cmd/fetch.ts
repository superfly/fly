import { root, getApp } from './root'
import { API } from './api'

export interface FetchOptions { }
export interface FetchArgs { }

root
  .subCommand<FetchOptions, FetchArgs>("fetch")
  .description("Fetch your Fly app locally.")
  .action(async (opts, args, rest) => {
    const appID = getApp()
    const res = await API.get(`/api/v1/apps/${appID}/source`)
    if (res.status === 200)
      console.log(res.data.data.attributes.source)
  })