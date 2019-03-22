// tslint:disable:no-shadowed-variable

import { FlyCommand } from "../../base-command"
import { apiClient } from "../../api"
import { processResponse } from "cli/src/api"
import { getAppName } from "cli/src/util"
import { flags } from "@oclif/command"
import { app, env } from "cli/src/flags"
import * as inquirer from "inquirer"
import { cli } from "cli-ux"

export default class Delete extends FlyCommand {
  static description = `delete an app`

  static flags = {
    app: app(),
    env: env()
  }

  static args = []

  public async run() {
    const { flags } = this.parse(this.ctor)

    const API = apiClient(this)
    const appName = getAppName(flags)

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
