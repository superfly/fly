import { FlyCommand } from "../../base-command"
import { processResponse } from "../../api"
import * as sharedFlags from "../../flags"
import { cli } from "cli-ux"

export default class AppsList extends FlyCommand {
  public static description = "list your apps"

  public static flags = {
    token: sharedFlags.apiToken()
  }

  public async run() {
    const { flags } = this.parse(AppsList)

    const API = this.apiClient(flags)

    const res = await API.get("/api/v1/apps")
    processResponse(this, res, () => {
      const apps = res.data.data.filter((app: any) => app.type === "nodeproxy_apps")
      cli.table(apps, {
        org: {
          header: "Organization",
          get: (row: any) => row.attributes.org
        },
        name: {
          header: "Name",
          get: (row: any) => row.attributes.name
        },
        version: {
          header: "Version",
          get: (row: any) => row.attributes.version
        }
      })
    })
  }
}
