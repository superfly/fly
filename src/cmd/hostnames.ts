import { root, getApp } from './root'
import { API } from './api'

interface HostnamesOptions { }
interface HostnamesArgs { }

const hostnames = root
  .subCommand<HostnamesOptions, HostnamesArgs>("hostnames")
  .description("Manage Fly app's hostnames.")
  .action(async (opts, args, rest) => {
    const res = await API.get(`/api/v1/apps/${getApp()}/hostnames`)
    if (res.status === 200) {
      if (res.data.data.length === 0)
        return console.log("No hostnames configured, use `fly hostnames add` to add one.")
      for (let h of res.data.data) {
        console.log(h.attributes.hostname)
      }
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
    const res = await API.post(`/api/v1/apps/${getApp()}/hostnames`, { data: { attributes: { hostname: args.hostname } } })
    if (res.status === 201) {
      console.log(`Successfully added hostname ${args.hostname}`)
    }
  })
