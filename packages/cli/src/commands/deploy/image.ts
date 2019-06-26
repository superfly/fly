import { FlyCommand } from "../../base-command"
import * as sharedFlags from "../../flags"
import { inspect } from "util"
import gql from "graphql-tag"

export default class Deploy extends FlyCommand {
  static description = "Deploy your local Fly app"

  static args = [{ name: "image", description: "image registry url" }]

  static hidden = true

  public static flags = {
    env: sharedFlags.env({ default: "production" }),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  async run() {
    const { args, flags } = this.parse(Deploy)

    const client = this.gqlClient(flags)
    const appName = this.getAppName({ ...flags })

    const resp = await client.mutate({
      mutation: DEPLOY_IMAGE,
      variables: {
        input: {
          appId: appName,
          image: args.image
        }
      }
    })

    console.log(inspect(resp, { showHidden: true, depth: 10, colors: true }))

    const app = resp.data.deployImage.deployment.app

    if (app.ip_addresses.nodes.length > 0) {
      this.log(`--> https://${app.ip_addresses.nodes[0].address}`)
    }
  }
}

const DEPLOY_IMAGE = gql`
  mutation($input: DeployImageInput!) {
    deployImage(input: $input) {
      deployment {
        id
        app {
          runtime
          status
          ip_addresses {
            nodes {
              address
            }
          }
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
