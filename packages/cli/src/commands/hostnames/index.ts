import { FlyCommand } from "../../base-command"
import { processResponse } from "../../api"
import * as sharedFlags from "../../flags"

export default class HostnamesList extends FlyCommand {
  public static description = "list hostnames for an app"

  public static flags = {
    env: sharedFlags.env(),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  public async run() {
    const { flags } = this.parse(HostnamesList)

    const appName = this.getAppName(flags)
    const API = this.apiClient(flags)

    const res = await API.get(`/api/v1/apps/${appName}/hostnames`)
    processResponse(this, res, () => {
      if (!res.data.data || res.data.data.length === 0) {
        return console.warn("No hostnames configured, use `fly hostnames:add` to add one.")
      }

      for (const h of res.data.data) {
        this.log(h.attributes.hostname)
      }
    })
  }
}
