import { root, fullAppMatch, CommonOptions, addCommonOptions, getAppName } from './root'
import { apiClient } from './api'
import { processResponse } from '../utils/cli'
import { existsSync, writeFileSync } from 'fs';
import { Command } from 'commandpost';

const Table = require('cli-table3')

const promptly = require('promptly')

export interface AppsOptions extends CommonOptions { }
export interface AppsArgs { }

export const apps = root
  .subCommand<AppsOptions, AppsArgs>("apps")
  .description("Manage Fly apps.")
  .action(async function (this: Command<AppsOptions, AppsArgs>, opts, args, rest) {
    const API = apiClient(this)
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

interface AppsCreateOptions extends CommonOptions { }
interface AppsCreateArgs {
  name?: string
}

const appsCreate = apps
  .subCommand<AppsCreateOptions, AppsCreateArgs>("create [name]")
  .description("Create a Fly app.")
  .usage(`fly apps create <org/app-name>

  - Format: org/app-name, find your organizations with \`fly orgs\`.
  - App name will be lowercased, accepted characters: [a-z0-9-_.]`)
  .action(async function (this: Command<AppsCreateOptions, AppsCreateArgs>, opts, args, rest) {
    const API = apiClient(this)
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

const appsMove = apps
  .subCommand<CommonOptions, any>("move")
  .description("Move a fly app to a different organization")
  .usage(`fly apps move`)
  .action(async function (this: Command<CommonOptions, any>, opts, args, rest) {
    const API = apiClient(this)
    const appName = getAppName(this)
    try {
      const res = await API.get(`/api/v1/orgs`)
      processResponse(res, async (res: any) => {
        const choices: any = {}
        for (let i in res.data.data)
          choices[i] = res.data.data[i].id

        let choiceText = ""
        for (const [i, slug] of Object.entries(choices))
          choiceText += `${i}) ${slug}\n`

        const chose = await promptly.choose(`Select organization to move to:
${choiceText}
Enter a number:`, Object.keys(choices))
        const orgSlug = choices[chose]
        console.log(`Moving app '${appName}' to organization '${orgSlug}'`)
        const resUpdate = await API.patch(`/api/v1/apps/${appName}`, { data: { attributes: { org_slug: orgSlug } } })

        processResponse(resUpdate, (res: any) => {
          console.log("Successfully moved app.")
        })
      })
    } catch (e) {
      if (e.response)
        return console.log(e.response.data)
      console.error(e.stack)
      throw e
    }
  })

const appsDelete = apps
  .subCommand<CommonOptions, any>("delete")
  .description("Delete a fly app")
  .usage(`fly apps delete`)
  .action(async function (this: Command<CommonOptions, any>, opts, args, rest) {
    const API = apiClient(this)
    const appName = getAppName(this)
    try {

      try {
        const answer = await promptly.choose(`Are you sure you want to delete '${appName}'?
Please type the app's name to confirm:`, [appName], { retry: false })
        if (answer !== appName) // double checking
          return console.log("NOT deleting app.")

        const res = await API.delete(`/api/v1/apps/${appName}`)
        processResponse(res, (res: any) => {
          console.log("App deleted.")
        })

      } catch (e) {
        if (e.message.includes("Invalid choice"))
          console.log("NOT deleting app.")
        else
          throw e
      }
    } catch (e) {
      if (e.response)
        return console.log(e.response.data)
      if (e.message.includes("canceled"))
        return
      console.error(e.stack)
      throw e
    }
  })

addCommonOptions(apps)
addCommonOptions(appsCreate)
addCommonOptions(appsMove)
addCommonOptions(appsDelete)