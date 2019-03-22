import { FlyCommand } from "../../base-command"
import { apiClient } from "../../api"
import { processResponse } from "cli/src/api"
import * as sharedFlags from "../../flags"
import { getAppName } from "cli/src/util"
import { flags as oclifFlags } from "@oclif/command"
import { readFileSync, existsSync } from "fs"

export default class SecretsSet extends FlyCommand {
  public static description = "add secrets to an app"

  static flags = {
    app: sharedFlags.app(),
    env: sharedFlags.env(),
    "from-file": oclifFlags.string({
      description: "use a file's contents as the secret value"
    })
  }

  static args = [
    { name: "key", description: "name of the secret", required: true },
    { name: "value", description: "value of the secret" }
  ]

  public async run() {
    const { args, flags } = this.parse(SecretsSet)
    const appName = getAppName(flags)

    const API = apiClient(this)
    const key = args.key
    const value = flags["from-file"] ? readFileSync(flags["from-file"]!).toString() : args.value

    if (!value) {
      throw new Error("Either a value or --from-file needs to be provided.")
    }

    const res = await API.patch(`/api/v1/apps/${appName}/secrets`, {
      data: {
        attributes: {
          key,
          value: Buffer.from(value).toString("base64")
        }
      }
    })
    processResponse(this, res, () => {
      console.log(`Deploying v${res.data.data.attributes.version} globally, should be updated in a few seconds.`)
    })
  }
}
