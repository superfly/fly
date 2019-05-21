import { FlyCommand } from "../base-command"
import { apiClient, processResponse } from "../api"
import { cli } from "cli-ux"
import * as sharedFlags from "../flags"

export default class Releases extends FlyCommand {
  public static description = "list releases for an app"

  public static flags = {
    env: sharedFlags.env(),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  public async run() {
    const { flags } = this.parse(Releases)

    const API = this.apiClient(flags)
    const appName = this.getAppName(flags)

    const res = await API.get(`/api/v1/apps/${appName}/releases`)
    processResponse(this, res, () => {
      if (res.data.data.length === 0) {
        return this.log(`No releases for ${appName} yet.`)
      }

      cli.table(res.data.data, {
        version: {
          header: "Version",
          get: (row: any) => `v${row.attributes.version}`
        },
        reason: {
          header: "Reason",
          get: (row: any) => row.attributes.reason
        },
        author: {
          header: "Author",
          get: (row: any) => row.attributes.author
        },
        date: {
          header: "Date",
          get: (row: any) => row.attributes.created_at
        }
      })
    })
  }
}
