import { FlyCommand } from "../../base-command"
import { apiClient } from "../../api"
import { processResponse } from "cli/src/api"
import * as sharedFlags from "../../flags"
import { getAppName } from "cli/src/util"

export default class HostnamesList extends FlyCommand {
  public static description = "list hostnames for an app"

  static flags = {
    app: sharedFlags.app(),
    env: sharedFlags.env()
  }

  public async run() {
    const { flags } = this.parse(this.ctor)
    const appName = getAppName(flags)
    const API = apiClient(this)

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
