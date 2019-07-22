import { FlyCommand } from "../../base-command"
import { processResponse } from "../../api"
import * as sharedFlags from "../../flags"

export default class HostnamesAdd extends FlyCommand {
  public static description = "add hostnames to an app"

  public static flags = {
    env: sharedFlags.env(),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
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

    const appName = this.getAppName(flags)
    const API = this.apiClient(flags)
    const hostname = args.hostname

    const res = await API.post(`/api/v1/apps/${appName}/hostnames`, {
      data: { attributes: { hostname } }
    })
    processResponse(this, res, () => {
      this.log(`Successfully added hostname ${hostname} to ${appName}`)
    })
  }
}
