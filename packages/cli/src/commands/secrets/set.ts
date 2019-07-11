import { FlyCommand } from "../../base-command"
import { processResponse } from "../../api"
import * as sharedFlags from "../../flags"
import { flags as oclifFlags } from "@oclif/command"
import { readFileSync } from "fs"
import { inspect } from "util"

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
    const client = this.gqlClient(flags)
    const key = args.key
    const value = flags["from-file"] ? readFileSync(flags["from-file"]!).toString() : args.value

    if (!value) {
      return this.error("Either a value or --from-file needs to be provided.")
    }

    const resp = await client.mutate({
      query: MUTATION,
      variables: {
        input: {
          appId: appName,
          secrets: [
            {
              key,
              value
            }
          ]
        }
      }
    })

    console.log(inspect(resp, { showHidden: true, depth: 10, colors: true }))
  }
}

const MUTATION = `
  mutation($input: SetSecretsInput!) {
    setSecrets(input: $input) {
      deployment {
        id
        app {
          runtime
          status
          ipAddresses {
            nodes {
              address
            }
          }
        }
        status
        currentPhase
      }
    }
  }
`
