import { root } from './root'
import { API } from './api'

const Table = require('cli-table2')

interface AppsOptions { }
interface AppsArgs { }

const apps = root
  .subCommand<AppsOptions, AppsArgs>("apps")
  .description("Manage Fly apps.")
  .action(async (opts, args, rest) => {
    const res = await API.get("/api/v1/apps")
    if (res.status === 200) {
      const table = new Table({
        style: { head: [] },
        head: ['id', 'name', 'version']
      })
      console.log(res.data.data)
      table.push(...res.data.data.map((a: any) =>
        [a.id, a.attributes.name, a.attributes.version]
      ))
      console.log(table.toString())
    }
  })

interface AppsCreateOptions { }
interface AppsCreateArgs {
  name: string
}

apps
  .subCommand<AppsCreateOptions, AppsCreateArgs>("create <name>")
  .description("Create a Fly app.")
  .action(async (opts, args, rest) => {
    const res = await API.post("/api/v1/apps", { data: { attributes: { name: args.name } } })
    if (res.status === 201) {
      console.log(`App created with id: "${res.data.data.id}"`)
    }
  })