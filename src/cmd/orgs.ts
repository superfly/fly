import { root } from './root'
import { API } from './api'

root
  .subCommand<any, any>("orgs")
  .description("Manage Fly orgs.")
  .action(async (opts, args, rest) => {
    const res = await API.get(`/api/v1/orgs`)
    if (res.status === 200) {
      for (let org of res.data.data)
        console.log(org.id)
    }
  })