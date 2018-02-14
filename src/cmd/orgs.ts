import { root } from './root'
import { API } from './api'
import { processResponse } from '../utils/cli'

root
  .subCommand<any, any>("orgs")
  .description("Manage Fly orgs.")
  .action(async (opts, args, rest) => {
    try {
      const res = await API.get(`/api/v1/orgs`)
      processResponse(res, (res: any) => {
        for (let org of res.data.data)
          console.log(org.id)
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  })