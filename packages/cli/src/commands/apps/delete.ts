import { FlyCommand } from "../../base-command"
import { processResponse } from "../../api"
import * as sharedFlags from "../../flags"
import { cli } from "cli-ux"

export default class Delete extends FlyCommand {
  static description = `delete an app`

  public static flags = {
    env: sharedFlags.env({ default: "production" }),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  static args = []

  public async run() {
    const { flags } = this.parse(Delete)

    const API = this.apiClient(flags)
    const appName = this.getAppName(flags)

    this.log(`Are you sure you want to delete '${appName}'?`)

    let tries = 1

    while (true) {
      const confirmation = await cli.prompt("Type the app's name to confirm", {})

      if (confirmation === appName) {
        break
      }

      if (++tries > 3) {
        this.error("too many attempts, not continuing", { exit: 1 })
        return
      }

      this.warn("incorrect, try again")
    }

    const res = await API.delete(`/api/v1/apps/${appName}`)
    processResponse(this, res, () => {
      console.log("App deleted.")
    })
  }
}
