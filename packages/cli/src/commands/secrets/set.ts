import { FlyCommand } from "../../base-command"
import { processResponse } from "../../api"
import * as sharedFlags from "../../flags"
import { flags as oclifFlags } from "@oclif/command"
import { readFileSync } from "fs"

export default class SecretsSet extends FlyCommand {
  public static description = "add secrets to an app"

  static flags = {
    app: sharedFlags.app(),
    env: sharedFlags.env(),
    token: sharedFlags.apiToken(),
    "from-file": oclifFlags.string({
      name: "from-file",
      description: "use a file's contents as the secret value"
    })
  }

  static args = [
    { name: "key", description: "name of the secret", required: true },
    { name: "value", description: "value of the secret" }
  ]

  public async run() {
    const { args, flags } = this.parse(SecretsSet)

    const appName = this.getAppName(flags)
    const API = this.apiClient(flags)
    const key = args.key
    const value = flags["from-file"] ? readFileSync(flags["from-file"]!).toString() : args.value

    if (!value) {
      return this.error("Either a value or --from-file needs to be provided.")
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
