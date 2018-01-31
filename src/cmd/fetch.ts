import { root, getApp } from './root'
import { API } from './api'

export interface FetchOptions { }
export interface FetchArgs { }

root
  .subCommand<FetchOptions, FetchArgs>("fetch")
  .description("Fecth your Fly app locally.")
  .action(async (opts, args, rest) => {
    const appID = getApp()
    const appRes = await API.get(`/api/v1/apps/${appID}`)
    if (appRes.status === 200) {
      const res = await API.get(`/api/v1/apps/${appID}/releases/${appRes.data.data.id}`)
      console.log(res.data.attributes.source)
    }
  })