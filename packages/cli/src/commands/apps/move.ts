import { FlyCommand } from "../../base-command"
import { processResponse } from "../../api"
import * as sharedFlags from "../../flags"
import * as inquirer from "inquirer"
import { cli } from "cli-ux"

export default class Move extends FlyCommand {
  static description = `move an new app to another organization`

  public static flags = {
    env: sharedFlags.env({ default: "production" }),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  static args = []

  public async run() {
    const { flags } = this.parse(Move)

    const API = this.apiClient(flags)
    const appName = this.getAppName(flags)

    const res = await API.get(`/api/v1/orgs`)
    processResponse(this, res, async () => {
      const choices = res.data.data.map((o: any) => o.id)

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
