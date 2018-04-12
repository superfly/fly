import { root, addCommonOptions, CommonOptions } from './root'
import { apiClient } from './api'
import { processResponse } from '../utils/cli'
import { Command } from 'commandpost';

const orgs = root
  .subCommand<CommonOptions, any>("orgs")
  .description("Manage Fly orgs.")
  .action(async function (this: Command<CommonOptions, any>, opts, args, rest) {
    const API = apiClient(this)
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

addCommonOptions(orgs)