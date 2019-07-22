import { FlyCommand } from "../../base-command"
import * as sharedFlags from "../../flags"
import { inspect } from "util"
import { cli } from "cli-ux"

export default class Deploy extends FlyCommand {
  static description = "Deploy your local Fly app"

  static args = [{ name: "image", description: "image registry url" }]

  static hidden = true

  public static flags = {
    env: sharedFlags.env(),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  async run() {
    const { args, flags } = this.parse(Deploy)

    const client = this.gqlClient(flags)
    const appName = this.getAppName({ ...flags })

    cli.action.start("deploying image")

    const resp = await client.mutate({
      query: DEPLOY_IMAGE,
      variables: {
        input: {
          appId: appName,
          image: args.image
        }
      }
    })

    cli.action.stop()

    // console.log(inspect(resp, { showHidden: true, depth: 10, colors: true }))

    const app = resp.data.deployImage.deployment.app

    this.log(`--> ${app.appUrl}`)
  }
}

const DEPLOY_IMAGE = `
  mutation($input: DeployImageInput!) {
    deployImage(input: $input) {
      deployment {
        id
        app {
          runtime
          status
          appUrl
        }
        status
        currentPhase
        release {
          version
        }
      }
    }
  }
`
