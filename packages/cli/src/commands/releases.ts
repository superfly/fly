import { FlyCommand } from "../base-command"
import { apiClient, processResponse } from "../api"
import { cli } from "cli-ux"
import * as sharedFlags from "../flags"

export default class Releases extends FlyCommand {
  public static description = "list releases for an app"

  public static flags = {
    env: sharedFlags.env(),
    app: sharedFlags.app(),
    token: sharedFlags.apiToken()
  }

  public async run() {
    const { flags } = this.parse(Releases)

    const client = this.gqlClient(flags)
    const appName = this.getAppName(flags)

    const resp = await client.query({
      query: RELEASES,
      variables: {
        appId: appName
      }
    })

    const { app } = resp.data

    cli.table(app.releases.nodes, {
      version: {
        get: (row: any) => `v${row.version}`
      },
      description: {
        get: (row: any) => row.description
      },
      user: {
        get: (row: any) => row.user.email
      },
      date: {
        get: (row: any) => row.createdAt
      }
    })
  }
}

const RELEASES = `
  query($appId: String!) {
    app(id: $appId) {
      id
      name
      releases {
        nodes {
          version
          createdAt
          description
          user {
            email
          }
        }
      }
    }
  }
`
