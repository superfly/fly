import { FlyCommand } from "../../base-command"
import { apiClient } from "../../api"
import { processResponse } from "cli/src/api"
import { cli } from "cli-ux"

export default class AppsList extends FlyCommand {
  public static description = "list your apps"

  public async run() {
    // tslint:disable-next-line:no-shadowed-variable
    // const { args, flags } = this.parse(ServerCmd)

    const API = apiClient(this)

    const res = await API.get("/api/v1/apps")
    processResponse(this, res, () => {
      cli.table(res.data.data, {
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
