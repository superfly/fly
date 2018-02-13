import { root, getAppId } from './root'
import { API } from './api'
import { processResponse } from '../utils/cli'

interface HostnamesOptions { }
interface HostnamesArgs { }

const hostnames = root
  .subCommand<HostnamesOptions, HostnamesArgs>("hostnames")
  .description("Manage Fly app's hostnames.")
  .action(async (opts, args, rest) => {
    try {
      const res = await API.get(`/api/v1/apps/${getAppId()}/hostnames`)
      processResponse(res, (res: any) => {
        if (!res.data.data || res.data.data.length === 0)
          return console.log("No hostnames configured, use `fly hostnames add` to add one.")
        for (let h of res.data.data) {
          console.log(h.attributes.hostname)
        }
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  })

interface HostnamesAddOptions { }
interface HostnamesAddArgs {
  hostname: string
}

hostnames
  .subCommand<HostnamesAddOptions, HostnamesAddArgs>("add <hostname>")
  .description("Add a hostname to your fly app.")
  .action(async (opts, args, rest) => {
    try {
      const res = await API.post(`/api/v1/apps/${getAppId()}/hostnames`, { data: { attributes: { hostname: args.hostname } } })
      processResponse(res, (res: any) => {
        console.log(`Successfully added hostname ${args.hostname}`)
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  })


