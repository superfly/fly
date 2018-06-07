import { root, getAppName, CommonOptions, addCommonOptions } from './root'
import { apiClient } from './api'
import { processResponse } from '../utils/cli'
import { Command } from 'commandpost';

interface HostnamesOptions extends CommonOptions { }
interface HostnamesArgs { }

const hostnames = root
  .subCommand<HostnamesOptions, HostnamesArgs>("hostnames")
  .description("Manage Fly app's hostnames.")
  .action(async function (this: Command<HostnamesOptions, HostnamesArgs>, opts, args, rest) {
    const API = apiClient(this)
    try {
      const res = await API.get(`/api/v1/apps/${getAppName(this)}/hostnames`)
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

const hostnamesAdd = hostnames
  .subCommand<HostnamesAddOptions, HostnamesAddArgs>("add <hostname>")
  .description("Add a hostname to your fly app.")
  .action(async function (this: Command<HostnamesOptions, HostnamesArgs>, opts, args, rest) {
    const API = apiClient(this)
    try {
      const res = await API.post(`/api/v1/apps/${getAppName(this)}/hostnames`, { data: { attributes: { hostname: args.hostname } } })
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

addCommonOptions(hostnames)
addCommonOptions(hostnamesAdd)