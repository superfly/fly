import { root, getAppName } from './root'
import { API } from './api'
import { processResponse } from '../utils/cli'
import { COMMAND, OPTION } from './argTypes'

interface HostnamesOptions { }
interface HostnamesArgs { }

root.add([{
  type: COMMAND,
  name: 'hostnames',
  description: "Manage Fly app's hostnames.",
  action: async () => {
    try {
      const res = await API.get(`/api/v1/apps/${getAppName()}/hostnames`)
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
  }
},
{
  type: COMMAND,
  name: 'add',
  takesArguments: true,
  mapTo: 'hostname',
  description: "Add a hostname to your fly app.",
  action: async () => {
    const opts = root.getOptions(false)
    try {
      const res = await API.post(`/api/v1/apps/${getAppName()}/hostnames`, { data: { attributes: { hostname: opts.hostname } } })
      processResponse(res, (res: any) => {
        console.log(`Successfully added hostname ${opts.hostname}`)
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  }
}])
