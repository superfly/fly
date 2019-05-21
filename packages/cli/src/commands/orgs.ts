import { FlyCommand } from "../base-command"
import { processResponse } from "../api"
import * as sharedFlags from "../flags"

export default class Orgs extends FlyCommand {
  public static description = "list your organizations"

  public static flags = {
    token: sharedFlags.apiToken()
  }

  async run() {
    const { flags } = this.parse(Orgs)

    const API = this.apiClient(flags)

    const res = await API.get(`/api/v1/orgs`)
    processResponse(this, res, () => {
      for (const org of res.data.data) {
        this.log(org.id)
      }
    })
  }
}
