import { FlyCommand } from "../base-command"
import { apiClient } from "../api"
import { processResponse } from "cli/src/api"

export default class Orgs extends FlyCommand {
  public static description = "list your organizations"

  public async run() {
    const API = apiClient(this)

    const res = await API.get(`/api/v1/orgs`)
    processResponse(this, res, () => {
      for (const org of res.data.data) {
        this.log(org.id)
      }
    })
  }
}
