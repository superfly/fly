import { FlyCommand } from "../../base-command"
import { apiClient, processResponse } from "../../api"
import * as sharedFlags from "../../flags"
import { getAppName } from "../../util"

export default class HostnamesAdd extends FlyCommand {
  public static description = "add hostnames to an app"

  static flags = {
    app: sharedFlags.app(),
    env: sharedFlags.env()
  }

  static args = [
    {
      name: "hostname",
      description: "hostname to add",
      required: true
    }
  ]

  public async run() {
    const { args, flags } = this.parse(HostnamesAdd)
    const appName = getAppName(flags)
    const API = apiClient(this)
    const hostname = args.hostname

    const res = await API.post(`/api/v1/apps/${appName}/hostnames`, {
      data: { attributes: { hostname } }
    })
    processResponse(this, res, () => {
      this.log(`Successfully added hostname ${hostname} to ${appName}`)
    })
  }
}
