import { root, fullAppMatch } from './root'
import { API } from './api'
import { processResponse } from '../utils/cli'

const Table = require('cli-table2')

interface AppsOptions { }
interface AppsArgs { }

const apps = root
  .subCommand<AppsOptions, AppsArgs>("apps")
  .description("Manage Fly apps.")
  .action(async (opts, args, rest) => {
    try {
      const res = await API.get("/api/v1/apps")
      processResponse(res, (res: any) => {
        const table = new Table({
          style: { head: [] },
          head: ['id', 'version']
        })
        table.push(...res.data.data.map((a: any) =>
          [a.attributes.full_id, a.attributes.version]
        ))
        console.log(table.toString())
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  })

interface AppsCreateOptions { }
interface AppsCreateArgs {
  fullname: string
}

apps
  .subCommand<AppsCreateOptions, AppsCreateArgs>("create <fullname>")
  .description("Create a Fly app.")
  .usage(`fly apps create <org/app-name>

  - Format: org/app-name, find your organizations with \`fly orgs\`.
  - App name will be lowercased, accepted characters: [a-z0-9-_.]`)
  .action(async (opts, args, rest) => {
    try {
      const match = args.fullname.match(fullAppMatch)
      if (!match)
        return console.log("Please provide a full org/app name (ie: your-org/app-name)")

      const [_, org, app] = match
      const res = await API.post(`/api/v1/apps/${org}`, { data: { attributes: { name: app } } })
      processResponse(res, (res: any) => {
        console.log(`App created! Add it to your .fly.yml like: \`app_id: ${res.data.data.attributes.full_id}\``)
      })
    } catch (e) {
      if (e.response)
        console.log(e.response.data)
      else
        throw e
    }
  })