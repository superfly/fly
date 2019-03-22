// tslint:disable:no-shadowed-variable

import { FlyCommand } from "../../base-command"
import { apiClient } from "../../api"
import { processResponse } from "cli/src/api"
import { getAppName } from "cli/src/util"
import { flags } from "@oclif/command"
import { app, env } from "cli/src/flags"
import * as inquirer from "inquirer"
import { cli } from "cli-ux"

export default class Move extends FlyCommand {
  static description = `move an new app to another organization`

  static flags = {
    app: app(),
    env: env()
  }

  static args = []

  public async run() {
    const { flags } = this.parse(this.ctor)
    console.log(flags)
    const API = apiClient(this)
    const appName = getAppName(flags)

    const res = await API.get(`/api/v1/orgs`)
    processResponse(this, res, async () => {
      const choices = res.data.data.map((org: any) => org.id)

      const org: any = await inquirer.prompt([
        {
          name: "slug",
          message: "select an organization",
          type: "list",
          choices
        }
      ])

      const orgSlug = (org && org.slug) || ""

      if (!orgSlug) {
        throw new Error("no organization selected")
      }

      cli.action.start(`Moving app '${appName}' to organization '${orgSlug}'`)

      const resUpdate = await API.patch(`/api/v1/apps/${appName}`, {
        data: {
          attributes: {
            org_slug: orgSlug
          }
        }
      })

      processResponse(this, resUpdate, () => {
        cli.action.stop()
      })
    })
  }
}
