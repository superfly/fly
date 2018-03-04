import { root, fullAppMatch } from './root'
import { API } from './api'
import { processResponse } from '../utils/cli'
import { existsSync, writeFileSync } from 'fs';

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
          head: ['org', 'name', 'version']
        })
        table.push(...res.data.data.map((a: any) =>
          [a.attributes.org, a.attributes.name, a.attributes.version]
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
  name?: string
}

apps
  .subCommand<AppsCreateOptions, AppsCreateArgs>("create [name]")
  .description("Create a Fly app.")
  .usage(`fly apps create <org/app-name>

  - Format: org/app-name, find your organizations with \`fly orgs\`.
  - App name will be lowercased, accepted characters: [a-z0-9-_.]`)
  .action(async (opts, args, rest) => {
    try {
      let name = null;
      if (args.name) {
        if (!args.name.match(fullAppMatch))
          return console.log("App name, if provided, needs to match regex:", fullAppMatch)
        name = args.name
      }
      const res = await API.post(`/api/v1/apps`, { data: { attributes: { name: name } } })
      processResponse(res, (res: any) => {
        console.log(`App ${res.data.data.attributes.name} created!`)
        if (existsSync(".fly.yml"))
          console.log(`Add it to your .fly.yml like: \`app: ${res.data.data.attributes.name}\``)
        else {
          writeFileSync(".fly.yml", `app: ${res.data.data.attributes.name}`)
          console.log("Created a .fly.yml for you.")
        }
      })
    } catch (e) {
      if (e.response)
        return console.log(e.response.data)
      console.error(e.stack)
      throw e
    }
  })